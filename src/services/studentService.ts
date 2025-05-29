
'use server';

import { db } from '@/lib/firebase';
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
  serverTimestamp
} from 'firebase/firestore';
// When using Firebase Storage, you would import:
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STUDENTS_COLLECTION = 'students';

// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToStudentData = (docData: any, id: string): StudentData => {
  const data = docData as Omit<StudentData, 'id' | 'dateOfBirth' | 'registrationDate'> & {
    dateOfBirth: Timestamp | Date | string; 
    registrationDate: Timestamp | Date | string;
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

  return {
    ...data,
    id,
    dateOfBirth: dob,
    registrationDate: regDate,
    bloodGroup: data.bloodGroup || undefined, // Handle optional bloodGroup
    photographUrl: data.photographUrl || "https://placehold.co/120x150.png", 
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
    const studentDocRef = doc(db, STUDENTS_COLLECTION, id);
    let studentSnap = await getDoc(studentDocRef);

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

// Function to upload image to Firebase Storage (example, not fully integrated in this step for brevity)
// async function uploadPhotograph(file: File, prnNumber: string): Promise<string> {
//   const storage = getStorage();
//   const storageRef = ref(storage, `student_photos/${prnNumber}/${file.name}`);
//   await uploadBytes(storageRef, file);
//   const downloadURL = await getDownloadURL(storageRef);
//   return downloadURL;
// }

export async function registerStudent(
  studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'> & { photograph?: File | null, dateOfBirth: Date, photographUrl?: string }
): Promise<StudentData> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentData.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`Student with PRN number ${studentData.prnNumber} already exists.`);
    }

    let finalPhotographUrl = studentData.photographUrl || "https://placehold.co/120x150.png";
    
    // // Example: If a photograph file is provided, upload it
    // if (studentData.photograph) {
    //   try {
    //     finalPhotographUrl = await uploadPhotograph(studentData.photograph, studentData.prnNumber);
    //   } catch (uploadError) {
    //     console.error("Photograph upload failed: ", uploadError);
    //     // Decide if registration should proceed with a placeholder or fail
    //     // For now, it proceeds with the default placeholder set above
    //     throw new Error("Photograph upload failed. Cannot register student.");
    //   }
    // }


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
      photographUrl: data.photographUrl || "https://placehold.co/120x150.png",
      registrationDate: serverTimestamp(),
    };

    if (data.bloodGroup) {
      studentToSave.bloodGroup = data.bloodGroup;
    }

    batch.set(studentDocRef, studentToSave);
    prnsInBatch.add(data.prnNumber);
    
    newStudentsPlaceholder.push({
        ...studentToSave,
        id: studentDocRef.id, 
        registrationDate: new Date(), 
        dateOfBirth: studentToSave.dateOfBirth.toDate(),
        bloodGroup: studentToSave.bloodGroup,
    });
    successCount++;
  }

  try {
    await batch.commit();
    return { successCount, newStudents: newStudentsPlaceholder, errors };
  } catch (error) {
    console.error("Error committing bulk student registration: ", error);
    errors.push(`Batch commit failed: ${error instanceof Error ? error.message : String(error)}`);
    // If batch commit fails, no students were successfully added in this batch
    return { successCount: 0, newStudents: [], errors }; 
  }
}
