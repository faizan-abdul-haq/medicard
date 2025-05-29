
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
    dateOfBirth: Timestamp | Date; // Firestore might return Timestamp or already converted Date by SDK in some cases
    registrationDate: Timestamp | Date;
  };
  return {
    ...data,
    id,
    dateOfBirth: data.dateOfBirth instanceof Timestamp ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
    registrationDate: data.registrationDate instanceof Timestamp ? data.registrationDate.toDate() : new Date(data.registrationDate),
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
  studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'> & { photograph?: File | null, dateOfBirth: Date }
): Promise<StudentData> {
  try {
    // Check if student with this PRN already exists
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentData.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`Student with PRN number ${studentData.prnNumber} already exists.`);
    }

    const studentToSave = {
      ...studentData,
      registrationDate: serverTimestamp(), // Use server timestamp for registration
      photographUrl: studentData.photograph ? "https://placehold.co/100x120.png" : (studentData.photographUrl || "https://placehold.co/100x120.png"), // Simulate photo URL
      photograph: undefined, // Remove File object before saving
    };
    
    // Type assertion to ensure correct fields are passed to addDoc
    const docDataToSave = {
      fullName: studentToSave.fullName,
      address: studentToSave.address,
      dateOfBirth: studentToSave.dateOfBirth, // JS Date object is fine, Firestore converts it
      mobileNumber: studentToSave.mobileNumber,
      prnNumber: studentToSave.prnNumber,
      rollNumber: studentToSave.rollNumber,
      yearOfJoining: studentToSave.yearOfJoining,
      courseName: studentToSave.courseName,
      photographUrl: studentToSave.photographUrl,
      registrationDate: studentToSave.registrationDate,
    };


    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), docDataToSave);
    
    // Fetch the just-added document to get its actual data including the server-generated timestamp
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to retrieve newly created student document.");
    }
    
    return mapFirestoreDocToStudentData(newDocSnap.data(), newDocSnap.id);

  } catch (error) {
    console.error("Error registering student: ", error);
    if (error instanceof Error) {
        throw error; // Rethrow known errors (like PRN exists)
    }
    throw new Error("Failed to register student in Firestore.");
  }
}


export async function bulkRegisterStudents(studentsData: Partial<StudentData>[]): Promise<{ successCount: number; newStudents: StudentData[], errors: string[] }> {
  const batch = writeBatch(db);
  const newStudents: StudentData[] = [];
  const errors: string[] = [];
  let successCount = 0;

  for (const data of studentsData) {
    if (!data.prnNumber) {
      errors.push(`Skipping student with missing PRN: ${data.fullName || 'Unknown Name'}`);
      continue;
    }

    // Basic check for existing PRN to avoid duplicates in this batch operation
    // For a large-scale app, more sophisticated duplicate checking or upsert logic might be needed.
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", data.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      errors.push(`Student with PRN ${data.prnNumber} (${data.fullName}) already exists. Skipped.`);
      continue;
    }
    
    const studentDocRef = doc(collection(db, STUDENTS_COLLECTION)); // Auto-generate ID

    const studentToSave = {
      fullName: data.fullName || 'N/A',
      address: data.address || 'N/A',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('2000-01-01'),
      mobileNumber: data.mobileNumber || 'N/A',
      prnNumber: data.prnNumber,
      rollNumber: data.rollNumber || 'N/A_ROLL',
      yearOfJoining: data.yearOfJoining || new Date().getFullYear().toString(),
      courseName: data.courseName || 'N/A Course',
      photographUrl: data.photographUrl || "https://placehold.co/100x120.png",
      registrationDate: serverTimestamp(), // Use server timestamp
    };
    batch.set(studentDocRef, studentToSave);
    
    // We can't easily get the server-generated timestamp back from a batch write
    // So, we'll construct a local version for the return, knowing registrationDate will be a server value.
    // For a more accurate return, you might re-fetch these after the batch commit.
    newStudents.push({
        ...studentToSave,
        id: studentDocRef.id, // The auto-generated ID
        registrationDate: new Date(), // Placeholder, actual will be server time
        dateOfBirth: studentToSave.dateOfBirth instanceof Date ? studentToSave.dateOfBirth : new Date(studentToSave.dateOfBirth),
    });
    successCount++;
  }

  try {
    await batch.commit();
    console.log(`Bulk registered ${successCount} students into Firestore.`);
    // To return accurate data with server timestamps, you might need to re-fetch them
    // For simplicity now, we return the locally constructed objects
    return { successCount, newStudents, errors };
  } catch (error) {
    console.error("Error committing bulk student registration: ", error);
    // If batch fails, none are written.
    throw new Error("Failed to bulk register students in Firestore.");
  }
}


// Note: The resetMockStudents function is no longer relevant as we're using Firestore.
// If you need to clear the Firestore collection for testing, you'd do that manually via Firebase console
// or write a separate admin script.
