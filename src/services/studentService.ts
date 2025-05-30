
'use server';

import { db, storage } from '@/lib/firebase'; // Added storage
import type { StudentData } from '@/lib/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  Timestamp,
  writeBatch,
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage imports

const STUDENTS_COLLECTION = 'students';

// Helper function to upload photograph to Firebase Storage
async function uploadPhotograph(file: File, prnNumber: string): Promise<string> {
  const filePath = `student_photos/${prnNumber}/${Date.now()}_${file.name}`; // Add timestamp to filename for uniqueness
  const storageRef = ref(storage, filePath);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading photograph for PRN ${prnNumber}: `, error);
    throw new Error(`Failed to upload photograph. ${error instanceof Error ? error.message : ''}`);
  }
}


// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToStudentData = (docData: any, id: string): StudentData => {
  const data = docData as Omit<StudentData, 'id' | 'dateOfBirth' | 'registrationDate' | 'printHistory'> & {
    dateOfBirth: Timestamp | Date | string; 
    registrationDate: Timestamp | Date | string;
    printHistory?: Array<Timestamp | Date | string>;
  };
  
  let dob: Date;
  if (data.dateOfBirth instanceof Timestamp) {
    dob = data.dateOfBirth.toDate();
  } else if (data.dateOfBirth instanceof Date) {
    dob = data.dateOfBirth;
  } else {
    dob = new Date(data.dateOfBirth); 
  }

  let regDate: Date;
  if (data.registrationDate instanceof Timestamp) {
    regDate = data.registrationDate.toDate();
  } else if (data.registrationDate instanceof Date) {
    regDate = data.registrationDate;
  } else {
    regDate = new Date(data.registrationDate);
  }

  let printHistoryDates: Date[] | undefined = undefined;
  if (data.printHistory && Array.isArray(data.printHistory)) {
    printHistoryDates = data.printHistory.map(ph => {
      if (ph instanceof Timestamp) return ph.toDate();
      if (ph instanceof Date) return ph;
      return new Date(ph);
    }).sort((a,b) => b.getTime() - a.getTime()); // Sort descending
  }

  return {
    ...data,
    id,
    dateOfBirth: dob,
    registrationDate: regDate,
    bloodGroup: data.bloodGroup || undefined,
    photographUrl: data.photographUrl || "https://placehold.co/120x150.png",
    printHistory: printHistoryDates,
    // emergencyContactName: data.emergencyContactName || undefined,
    // emergencyContactPhone: data.emergencyContactPhone || undefined,
    // allergies: data.allergies || undefined,
    // medicalConditions: data.medicalConditions || undefined,
  };
};

export async function getStudents(): Promise<StudentData[]> {
  try {
    const studentsCollection = collection(db, STUDENTS_COLLECTION);
    const studentSnapshot = await getDocs(studentsCollection);
    const studentList = studentSnapshot.docs.map(doc => mapFirestoreDocToStudentData(doc.data(), doc.id));
    return studentList;
  } catch (error) {
    console.error("Error fetching students: ", error);
    throw new Error("Failed to fetch students from Firestore.");
  }
}

export async function getStudentById(id: string): Promise<StudentData | null> {
  try {
    const studentDocRefById = doc(db, STUDENTS_COLLECTION, id);
    let studentSnap = await getDoc(studentDocRefById);

    if (studentSnap.exists()) {
      return mapFirestoreDocToStudentData(studentSnap.data(), studentSnap.id);
    } else {
      const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        return mapFirestoreDocToStudentData(studentDoc.data(), studentDoc.id);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching student by ID/PRN ${id}: `, error);
    throw new Error("Failed to fetch student data from Firestore.");
  }
}

export async function recordCardPrint(studentPrn: string): Promise<void> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentPrn));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`Student with PRN ${studentPrn} not found. Cannot record print event.`);
      return;
    }
    
    const studentDoc = querySnapshot.docs[0];
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentDoc.id);

    await updateDoc(studentDocRef, {
      printHistory: arrayUnion(serverTimestamp()) 
    });
    console.log(`Print recorded for student PRN ${studentPrn}`);
  } catch (error) {
    console.error(`Error recording card print for PRN ${studentPrn}: `, error);
  }
}

export async function registerStudent(
  studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl' | 'printHistory'> & { photograph?: File | null, dateOfBirth: Date }
): Promise<StudentData> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentData.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`Student with PRN number ${studentData.prnNumber} already exists.`);
    }

    let finalPhotographUrl = "https://placehold.co/120x150.png";
    
    if (studentData.photograph) {
      try {
        finalPhotographUrl = await uploadPhotograph(studentData.photograph, studentData.prnNumber);
      } catch (uploadError) {
        console.error("Photograph upload failed: ", uploadError);
        // Decide if registration should proceed with a placeholder or fail
        // For now, it proceeds with the default placeholder set above, but throws error to inform user
        throw new Error(`Photograph upload failed. Student not registered. ${uploadError instanceof Error ? uploadError.message : ''}`);
      }
    }

    const docDataToSave: any = {
      fullName: studentData.fullName,
      address: studentData.address,
      dateOfBirth: Timestamp.fromDate(studentData.dateOfBirth),
      mobileNumber: studentData.mobileNumber,
      prnNumber: studentData.prnNumber,
      rollNumber: studentData.rollNumber,
      yearOfJoining: studentData.yearOfJoining,
      courseName: studentData.courseName,
      photographUrl: finalPhotographUrl,
      registrationDate: serverTimestamp(),
      printHistory: [],
      // emergencyContactName: studentData.emergencyContactName || null,
      // emergencyContactPhone: studentData.emergencyContactPhone || null,
      // allergies: studentData.allergies || null,
      // medicalConditions: studentData.medicalConditions || null,
    };

    if (studentData.bloodGroup) {
      docDataToSave.bloodGroup = studentData.bloodGroup;
    }

    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), docDataToSave);
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to retrieve newly created student document.");
    }
    
    return mapFirestoreDocToStudentData(newDocSnap.data(), newDocSnap.id);

  } catch (error) {
    console.error("Error registering student: ", error);
    if (error instanceof Error) {
        throw error; 
    }
    throw new Error("Failed to register student in Firestore.");
  }
}

export async function bulkRegisterStudents(studentsData: StudentData[]): Promise<{ successCount: number; newStudents: StudentData[], errors: string[] }> {
  const batch = writeBatch(db);
  const newStudentsPlaceholder: StudentData[] = []; 
  const errors: string[] = [];
  let successCount = 0;

  const prnsInBatch = new Set<string>();

  for (const data of studentsData) {
    if (!data.prnNumber) {
      errors.push(`Skipping student with missing PRN: ${data.fullName || 'Unknown Name'}`);
      continue;
    }
    if (prnsInBatch.has(data.prnNumber)) {
      errors.push(`Duplicate PRN ${data.prnNumber} within this batch for ${data.fullName}. Skipped.`);
      continue;
    }

    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", data.prnNumber));
    const querySnapshot = await getDocs(q); 
    if (!querySnapshot.empty) {
      errors.push(`Student with PRN ${data.prnNumber} (${data.fullName || 'N/A'}) already exists in database. Skipped.`);
      continue;
    }
    
    const studentDocRef = doc(collection(db, STUDENTS_COLLECTION)); 

    const studentToSave: any = {
      fullName: data.fullName || 'N/A',
      address: data.address || 'N/A',
      dateOfBirth: data.dateOfBirth ? Timestamp.fromDate(new Date(data.dateOfBirth)) : Timestamp.fromDate(new Date('2000-01-01')),
      mobileNumber: data.mobileNumber || 'N/A',
      prnNumber: data.prnNumber,
      rollNumber: data.rollNumber || 'N/A_ROLL',
      yearOfJoining: data.yearOfJoining || new Date().getFullYear().toString(),
      courseName: data.courseName || 'N/A Course',
      photographUrl: data.photographUrl || "https://placehold.co/120x150.png", // Bulk upload assumes URL is provided or uses placeholder
      registrationDate: serverTimestamp(),
      printHistory: [],
      // emergencyContactName: data.emergencyContactName || null,
      // emergencyContactPhone: data.emergencyContactPhone || null,
      // allergies: data.allergies || null,
      // medicalConditions: data.medicalConditions || null,
    };

    if (data.bloodGroup) {
      studentToSave.bloodGroup = data.bloodGroup;
    }

    batch.set(studentDocRef, studentToSave);
    prnsInBatch.add(data.prnNumber);
    
    // For the return, simulate the full object structure
    const { photograph, ...restOfStudentToSave } = studentToSave; // remove photograph if it was accidentally passed
    newStudentsPlaceholder.push({
        ...restOfStudentToSave,
        id: studentDocRef.id, 
        registrationDate: new Date(), // This will be replaced by serverTimestamp effect
        dateOfBirth: studentToSave.dateOfBirth.toDate(),
        bloodGroup: studentToSave.bloodGroup,
        printHistory: [],
        // ensure all fields are present even if null
        // emergencyContactName: studentToSave.emergencyContactName,
        // emergencyContactPhone: studentToSave.emergencyContactPhone,
        // allergies: studentToSave.allergies,
        // medicalConditions: studentToSave.medicalConditions,
    });
    successCount++;
  }

  try {
    await batch.commit();
    // Fetch the actual newly created students to return correct data with server timestamps
    const actualNewStudents: StudentData[] = [];
    for (const placeholder of newStudentsPlaceholder) {
        const newDocSnap = await getDoc(doc(db, STUDENTS_COLLECTION, placeholder.id));
        if (newDocSnap.exists()) {
            actualNewStudents.push(mapFirestoreDocToStudentData(newDocSnap.data(), newDocSnap.id));
        }
    }
    return { successCount, newStudents: actualNewStudents, errors };
  } catch (error) {
    console.error("Error committing bulk student registration: ", error);
    errors.push(`Batch commit failed: ${error instanceof Error ? error.message : String(error)}`);
    return { successCount: 0, newStudents: [], errors }; 
  }
}
