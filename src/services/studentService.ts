
'use server';

import { db, storage } from '@/lib/firebase'; // Added storage
import type { StudentData, PrintHistoryEntry } from '@/lib/types';
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
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
// import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added Firebase Storage functions
import { uploadStudentPhoto } from './photoUploadService'
const STUDENTS_COLLECTION = 'students';

// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToStudentData = (docData: any, id: string): StudentData => {
  const data = docData as Omit<StudentData, 'id' | 'dateOfBirth' | 'registrationDate' | 'printHistory'> & {
    dateOfBirth: Timestamp | Date | string; 
    registrationDate: Timestamp | Date | string;
    printHistory?: Array<{ printDate: Timestamp | Date | string, printedBy: string }>;
  };
  
  let dob: Date;
  if (data.dateOfBirth instanceof Timestamp) {
    dob = data.dateOfBirth.toDate();
  } else if (data.dateOfBirth instanceof Date) {
    dob = data.dateOfBirth;
  } else {
    const parsed = new Date(data.dateOfBirth);
    dob = isNaN(parsed.getTime()) ? new Date('1900-01-01') : parsed;
  }

  let regDate: Date;
  if (data.registrationDate instanceof Timestamp) {
    regDate = data.registrationDate.toDate();
  } else if (data.registrationDate instanceof Date) {
    regDate = data.registrationDate;
  } else {
    const parsed = new Date(data.registrationDate);
    regDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  let printHistory: PrintHistoryEntry[] | undefined = undefined;
  if (data.printHistory && Array.isArray(data.printHistory)) {
    printHistory = data.printHistory.map(entry => {
      let printDate: Date;
      if (entry.printDate instanceof Timestamp) {
        printDate = entry.printDate.toDate();
      } else if (entry.printDate instanceof Date) {
        printDate = entry.printDate;
      } else {
        const parsed = new Date(entry.printDate);
        printDate = isNaN(parsed.getTime()) ? new Date() : parsed;
      }
      return { printDate, printedBy: entry.printedBy || 'Unknown' };
    }).sort((a,b) => b.printDate.getTime() - a.printDate.getTime()); 
  }

  return {
    fullName: data.fullName,
    address: data.address,
    mobileNumber: data.mobileNumber,
    prnNumber: data.prnNumber,
    rollNumber: data.rollNumber,
    yearOfJoining: data.yearOfJoining,
    courseName: data.courseName,
    id,
    dateOfBirth: dob,
    registrationDate: regDate,
    bloodGroup: data.bloodGroup || undefined,
    photographUrl: data.photographUrl || "https://placehold.co/80x100.png",
    printHistory: printHistory,
    cardHolderSignature: data.cardHolderSignature
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


export async function recordCardPrint(studentPrn: string, printedBy: string): Promise<void> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentPrn));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`Student with PRN ${studentPrn} not found. Cannot record print event.`);
      return;
    }
    
    const studentDoc = querySnapshot.docs[0];
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentDoc.id);

    const newPrintEntry = {
      printDate: Timestamp.now(),
      printedBy: printedBy || 'System'
    };

    await updateDoc(studentDocRef, {
      printHistory: arrayUnion(newPrintEntry) 
    });
  } catch (error) {
    console.error(`Error recording card print for PRN ${studentPrn}: `, error);
    // Do not re-throw here to prevent breaking print preview if logging fails
  }
}

async function uploadPhotograph(photoFile: File, prnNumber: string): Promise<string> {
  const filePath = `student_photos/${prnNumber}/${Date.now()}_${photoFile.name}`;
  // const photoRef = ref(storage, filePath);
  // await uploadBytes(photoRef, photoFile);
  return uploadStudentPhoto(photoFile,prnNumber);
}

async function deletePhotograph(photographUrl: string): Promise<void> {
  if (!photographUrl || !photographUrl.startsWith("https://firebasestorage.googleapis.com") || photographUrl.includes("placehold.co")) {
    return;
  }
  // try {
  //   const photoRef = ref(storage, photographUrl);
  //   await deleteObject(photoRef);
  // } catch (error: any) {
  //   if (error.code === 'storage/object-not-found') {
  //     console.warn(`Photo not found for deletion (may have been already deleted): ${photographUrl}`);
  //   } else {
  //     console.error("Error deleting photograph from Firebase Storage: ", error);
  //   }
  // }
}


export async function registerStudent(
  studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl' | 'printHistory' | 'photograph'> & { photograph?: File | null, dateOfBirth: Date, photographUrl?: string | null }
): Promise<StudentData> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), where("prnNumber", "==", studentData.prnNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`PRN_EXISTS: Student with PRN number ${studentData.prnNumber} already exists.`);
    }

    let finalPhotographUrl = studentData.photographUrl || "https://placehold.co/80x100.png";
    if (studentData.photograph instanceof File) {
      finalPhotographUrl = await uploadPhotograph(studentData.photograph, studentData.prnNumber);
    }
    
    const docDataToSave: any = {
      fullName: studentData.fullName!,
      address: studentData.address || 'N/A',
      dateOfBirth: Timestamp.fromDate(studentData.dateOfBirth),
      mobileNumber: studentData.mobileNumber || 'N/A',
      prnNumber: studentData.prnNumber!,
      rollNumber: studentData.rollNumber!,
      yearOfJoining: studentData.yearOfJoining!,
      courseName: studentData.courseName!,
      photographUrl: finalPhotographUrl,
      registrationDate: serverTimestamp(),
      printHistory: [],
      cardHolderSignature: studentData.cardHolderSignature
    };

    if (studentData.bloodGroup) {
      docDataToSave.bloodGroup = studentData.bloodGroup;
    } else {
      docDataToSave.bloodGroup = null;
    }

    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), docDataToSave);
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to retrieve newly created student document after saving.");
    }
    
    return mapFirestoreDocToStudentData(newDocSnap.data(), newDocSnap.id);

  } catch (error: any) { 
    // Log more details of the raw error for server-side debugging
    console.error(
      "Error in registerStudent service (raw error details):", 
      "Name:", error.name, 
      "Message:", error.message, 
      "Code:", error.code, 
      "Stack:", error.stack
    );

    if (error instanceof Error && error.message.startsWith("PRN_EXISTS:")) {
      throw error; // Re-throw specific PRN_EXISTS error
    }
    
    // If a photograph file was part of the studentData, and an error occurred,
    // it's highly likely a storage permission issue.
    // if (studentData.photograph instanceof File && 
    //     (error.code === 'storage/unauthorized' || 
    //      error.code === 'storage/unauthenticated' ||
    //      (error.message && typeof error.message === 'string' && error.message.toLowerCase().includes("permission")) ||
    //      (error.name && typeof error.name === 'string' && error.name.toLowerCase().includes("firebaseerror") && error.message && error.message.toLowerCase().includes("storage"))
    //     )
    //    ) {
    //   console.error("Detailed Firebase Storage Permission Error:", error.name, error.message, error.code, error.stack);
    //   throw new Error(`STORAGE_PERMISSION_ERROR: Photo upload failed. This is very likely due to Firebase Storage security rules. Please ensure unauthenticated users are allowed to upload to the 'student_photos/' path in your Firebase Storage rules.`);
    // }

    // Check for Firestore specific permission denied error
    if (error.code === 'permission-denied') {
      console.error("Detailed Firebase Firestore Permission Error:", error.name, error.message, error.code, error.stack);
      throw new Error(`FIRESTORE_PERMISSION_ERROR: Saving student data failed due to a Firestore permission issue. Please check your Firebase Security Rules for the 'students' collection to allow unauthenticated writes if this is for student self-registration.`);
    }

    // Fallback for other errors
    // const originalErrorMessage = error instanceof Error ? error.message : String(error);
    // let userFriendlyMessage = `REGISTRATION_SERVICE_ERROR: An unexpected error occurred (${originalErrorMessage}).`;
    // if (studentData.photograph instanceof File) {
    //   userFriendlyMessage += " Since a photo was attached, please double-check Firebase Storage permissions for unauthenticated uploads to 'student_photos/'.";
    // } else {
    //   userFriendlyMessage += " Please check Firestore permissions or server logs for more details.";
    // }
    // console.error("Original error details during registration (fallback):", error.name, error.message, error.code, error.stack); 
    // throw new Error(userFriendlyMessage);
    throw new Error("An unexpected error occurred during student registration."); 

  }
}


export async function updateStudent(
  studentDocId: string,
  dataToUpdate: Partial<Omit<StudentData, 'id' | 'registrationDate' | 'photograph'>>,
  newPhotographFile?: File | null,
  existingPhotographUrl?: string | null
): Promise<StudentData> {
  try {
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentDocId);
    const currentDocSnap = await getDoc(studentDocRef);
    if (!currentDocSnap.exists()) {
      throw new Error("UPDATE_FAILED: Student document not found.");
    }
    const currentStudentData = currentDocSnap.data() as StudentData; 

    if (dataToUpdate.prnNumber && dataToUpdate.prnNumber !== currentStudentData.prnNumber) {
      const q = query(
        collection(db, STUDENTS_COLLECTION),
        where("prnNumber", "==", dataToUpdate.prnNumber)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty && querySnapshot.docs.some(d => d.id !== studentDocId)) {
        throw new Error(`UPDATE_FAILED_PRN_EXISTS: Student with PRN number ${dataToUpdate.prnNumber} already exists.`);
      }
    }
    
    let finalPhotographUrl = existingPhotographUrl;

    if (newPhotographFile instanceof File) {
      if (existingPhotographUrl && existingPhotographUrl !== "https://placehold.co/80x100.png") {
        await deletePhotograph(existingPhotographUrl);
      }
      finalPhotographUrl = await uploadPhotograph(newPhotographFile, dataToUpdate.prnNumber || currentStudentData.prnNumber);
    } else if (dataToUpdate.photographUrl === null) { 
        if (existingPhotographUrl && existingPhotographUrl !== "https://placehold.co/80x100.png") {
            await deletePhotograph(existingPhotographUrl);
        }
        finalPhotographUrl = "https://placehold.co/80x100.png";
    }

    const updatePayload: any = { ...dataToUpdate };
    if (finalPhotographUrl !== undefined) {
      updatePayload.photographUrl = finalPhotographUrl;
    }
    if (dataToUpdate.dateOfBirth) {
      updatePayload.dateOfBirth = Timestamp.fromDate(new Date(dataToUpdate.dateOfBirth));
    }
    
    delete updatePayload.id;
    delete updatePayload.registrationDate;
    
    const validFields: (keyof StudentData | "photographUrl")[] = ['prnNumber','fullName', 'address', 'dateOfBirth', 'mobileNumber', 'rollNumber', 'yearOfJoining', 'courseName', 'bloodGroup', 'photographUrl','cardHolderSignature'];
    for (const key in updatePayload) {
        if (!validFields.includes(key as keyof StudentData)) {
            delete updatePayload[key];
        }
    }

    await updateDoc(studentDocRef, updatePayload);

    const updatedDocSnap = await getDoc(studentDocRef);
     if (!updatedDocSnap.exists()) {
        throw new Error("UPDATE_FAILED: Failed to retrieve updated student document.");
    }
    return mapFirestoreDocToStudentData(updatedDocSnap.data(), updatedDocSnap.id);

  } catch (error) {
    console.error("Error updating student: ", error);
    if (error instanceof Error && (error.message.startsWith("UPDATE_FAILED") || error.message.startsWith("PRN_EXISTS"))) {
      throw error;
    }
    throw new Error("UPDATE_SERVICE_ERROR: An unexpected error occurred while updating student details.");
  }
}


export async function deleteStudent(studentDocId: string, photographUrl?: string): Promise<void> {
  try {
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentDocId);
    if (photographUrl) {
      await deletePhotograph(photographUrl);
    }
    await deleteDoc(studentDocRef);
  } catch (error) {
    console.error("Error deleting student: ", error);
    throw new Error("DELETE_SERVICE_ERROR: Failed to delete student.");
  }
}


export async function bulkRegisterStudents(studentsDataInput: StudentData[]): Promise<{ successCount: number; newStudents: StudentData[], errors: string[] }> {
  const batch = writeBatch(db);
  const newStudentsPlaceholder: StudentData[] = []; 
  const errors: string[] = [];
  let successCount = 0;

  const studentsData = studentsDataInput.map(s => ({
    ...s,
    dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : new Date('2000-01-01') 
  }));

  const prnsInBatch = new Set<string>();
  console.log(studentsData)

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
      dateOfBirth: data.dateOfBirth ? Timestamp.fromDate(data.dateOfBirth) : Timestamp.fromDate(new Date('2000-01-01')),
      mobileNumber: data.mobileNumber || 'N/A',
      prnNumber: data.prnNumber,
      rollNumber: data.rollNumber || 'N/A_ROLL',
      yearOfJoining: data.yearOfJoining || new Date().getFullYear().toString(),
      courseName: data.courseName || 'N/A Course',
      photographUrl: data.photographUrl || "https://placehold.co/80x100.png",
      registrationDate: serverTimestamp(),
      printHistory: [],
      cardHolderSignature: data.cardHolderSignature || "https://placehold.co/100x40.png?text=Signature"

    };
     if (data.bloodGroup) {
      studentToSave.bloodGroup = data.bloodGroup;
    } else {
      studentToSave.bloodGroup = null; 
    }

    batch.set(studentDocRef, studentToSave);
    prnsInBatch.add(data.prnNumber);
    
    newStudentsPlaceholder.push({
        ...data,
        id: studentDocRef.id, 
        registrationDate: new Date(), 
        printHistory: [],
        photographUrl: studentToSave.photographUrl,
    });
    successCount++;
  }

  try {
    await batch.commit();
    const actualNewStudents: StudentData[] = [];
    for (const placeholder of newStudentsPlaceholder) {
        const newDocSnap = await getDoc(doc(db, STUDENTS_COLLECTION, placeholder.id));
        if (newDocSnap.exists()) {
            actualNewStudents.push(mapFirestoreDocToStudentData(newDocSnap.data(), newDocSnap.id));
        } else {
            errors.push(`Failed to retrieve newly created student ${placeholder.prnNumber} after batch commit.`);
        }
    }
    return { successCount, newStudents: actualNewStudents, errors };
  } catch (error) {
    console.error("Error committing bulk student registration: ", error);
    errors.push(`Batch commit failed: ${error instanceof Error ? error.message : String(error)}`);
    return { successCount: 0, newStudents: [], errors }; 
  }
}
