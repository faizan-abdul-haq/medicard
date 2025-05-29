
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

const STUDENTS_COLLECTION = 'students';

// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToStudentData = (docData: any, id: string): StudentData => {
  const data = docData as Omit<StudentData, 'id' | 'dateOfBirth' | 'registrationDate'> & {
    dateOfBirth: Timestamp | Date | string; // Firestore might return Timestamp or already converted Date by SDK in some cases, or string if manually inserted
    registrationDate: Timestamp | Date | string;
  };
  
  let dob: Date;
  if (data.dateOfBirth instanceof Timestamp) {
    dob = data.dateOfBirth.toDate();
  } else if (data.dateOfBirth instanceof Date) {
    dob = data.dateOfBirth;
  } else {
    dob = new Date(data.dateOfBirth); // Attempt to parse if it's a string
  }

  let regDate: Date;
  if (data.registrationDate instanceof Timestamp) {
    regDate = data.registrationDate.toDate();
  } else if (data.registrationDate instanceof Date) {
    regDate = data.registrationDate;
  } else {
     // For serverTimestamp, it might not be immediately available as Date after write,
     // so on read, it will be Timestamp. If it's somehow a string, parse.
    regDate = new Date(data.registrationDate);
  }

  return {
    ...data,
    id,
    dateOfBirth: dob,
    registrationDate: regDate,
    photographUrl: data.photographUrl || "https://placehold.co/100x120.png", // Ensure placeholder if missing
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
    // First, try to get by document ID directly
    const studentDocRef = doc(db, STUDENTS_COLLECTION, id);
    let studentSnap = await getDoc(studentDocRef);

    if (studentSnap.exists()) {
      return mapFirestoreDocToStudentData(studentSnap.data(), studentSnap.id);
    } else {
      // If not found by ID, try querying by prnNumber (assuming id might be prnNumber)
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

export async function registerStudent(
  studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'> & { photograph?: File | null, dateOfBirth: Date, photographUrl?: string }
): Promise<StudentData> {
  try {
    // Check if student with this PRN already exists
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentData.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`Student with PRN number ${studentData.prnNumber} already exists.`);
    }

    // In a real app, if studentData.photograph (File object) exists,
    // you would upload it to Firebase Storage here and get the downloadURL.
    // For now, we'll use the provided photographUrl or a placeholder.
    const finalPhotographUrl = studentData.photographUrl || (studentData.photograph ? "https://placehold.co/100x120.png" : "https://placehold.co/100x120.png");


    const docDataToSave = {
      fullName: studentData.fullName,
      address: studentData.address,
      dateOfBirth: Timestamp.fromDate(studentData.dateOfBirth), // Convert JS Date to Firestore Timestamp
      mobileNumber: studentData.mobileNumber,
      prnNumber: studentData.prnNumber,
      rollNumber: studentData.rollNumber,
      yearOfJoining: studentData.yearOfJoining,
      courseName: studentData.courseName,
      photographUrl: finalPhotographUrl,
      registrationDate: serverTimestamp(), // Use server timestamp
    };

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

export async function bulkRegisterStudents(studentsData: Partial<StudentData>[]): Promise<{ successCount: number; newStudents: StudentData[], errors: string[] }> {
  const batch = writeBatch(db);
  const newStudentsPlaceholder: StudentData[] = []; // For optimistic return
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
    const querySnapshot = await getDocs(q); // Check existing PRNs in DB
    if (!querySnapshot.empty) {
      errors.push(`Student with PRN ${data.prnNumber} (${data.fullName || 'N/A'}) already exists in database. Skipped.`);
      continue;
    }
    
    const studentDocRef = doc(collection(db, STUDENTS_COLLECTION)); 

    const studentToSave = {
      fullName: data.fullName || 'N/A',
      address: data.address || 'N/A',
      dateOfBirth: data.dateOfBirth ? Timestamp.fromDate(new Date(data.dateOfBirth)) : Timestamp.fromDate(new Date('2000-01-01')),
      mobileNumber: data.mobileNumber || 'N/A',
      prnNumber: data.prnNumber,
      rollNumber: data.rollNumber || 'N/A_ROLL',
      yearOfJoining: data.yearOfJoining || new Date().getFullYear().toString(),
      courseName: data.courseName || 'N/A Course',
      photographUrl: data.photographUrl || "https://placehold.co/100x120.png",
      registrationDate: serverTimestamp(),
    };
    batch.set(studentDocRef, studentToSave);
    prnsInBatch.add(data.prnNumber);
    
    newStudentsPlaceholder.push({
        ...studentToSave,
        id: studentDocRef.id, 
        registrationDate: new Date(), // Placeholder, actual will be server time
        dateOfBirth: studentToSave.dateOfBirth.toDate(),
    });
    successCount++;
  }

  try {
    await batch.commit();
    // Note: To get accurate server timestamps for newStudents, a re-fetch would be needed.
    // For simplicity, newStudentsPlaceholder provides an optimistic preview.
    return { successCount, newStudents: newStudentsPlaceholder, errors };
  } catch (error) {
    console.error("Error committing bulk student registration: ", error);
    // Add a general error if batch commit fails
    errors.push(`Batch commit failed: ${error instanceof Error ? error.message : String(error)}`);
    return { successCount: 0, newStudents: [], errors }; // Return 0 success if batch fails
  }
}
