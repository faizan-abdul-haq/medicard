
'use server';

import { db, storage } from '@/lib/firebase';
import type { EmployeeData, EmployeeType, PrintHistoryEntry } from '@/lib/types';
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
import { uploadStudentPhoto } from './photoUploadService'; // Can be reused

const EMPLOYEES_COLLECTION = 'employees';

const mapFirestoreDocToEmployeeData = (docData: any, id: string): EmployeeData => {
  const data = docData as Omit<EmployeeData, 'id' | 'registrationDate' | 'printHistory' | 'dateOfBirth'> & {
    registrationDate: Timestamp | Date | string;
    printHistory?: Array<{ printDate: Timestamp | Date | string, printedBy: string }>;
    dateOfBirth?: Timestamp | Date | string;
  };
  
  const parseDate = (dateField: any): Date => {
    if (!dateField) return new Date('1900-01-01'); // Return a default or handle as invalid
    if (dateField instanceof Timestamp) return dateField.toDate();
    if (dateField instanceof Date) return dateField;
    const parsed = new Date(dateField);
    return isNaN(parsed.getTime()) ? new Date('1900-01-01') : parsed;
  };
  
  const parseNullableDate = (dateField: any): Date | undefined => {
    if (!dateField) return undefined;
    const parsed = parseDate(dateField);
    // Check if the parsed date is the default 'invalid' date
    return parsed.getFullYear() === 1900 ? undefined : parsed;
  };

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
    id,
    fullName: data.fullName,
    address: data.address,
    mobileNumber: data.mobileNumber,
    employeeId: data.employeeId,
    sevarthNo: data.sevarthNo,
    designation: data.designation,
    employeeType: data.employeeType || 'STAFF',
    dateOfBirth: parseNullableDate(data.dateOfBirth),
    registrationDate: parseDate(data.registrationDate),
    bloodGroup: data.bloodGroup || undefined,
    photographUrl: data.photographUrl || "https://placehold.co/80x100.png",
    printHistory: printHistory,
    cardHolderSignature: data.cardHolderSignature,
    isOrganDonor: data.isOrganDonor || false,
  };
};

export async function getEmployees(): Promise<EmployeeData[]> {
  try {
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const employeeSnapshot = await getDocs(employeesCollection);
    return employeeSnapshot.docs.map(doc => mapFirestoreDocToEmployeeData(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching employees: ", error);
    throw new Error("Failed to fetch employees from Firestore.");
  }
}

export async function getEmployeeById(id: string): Promise<EmployeeData | null> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, id);
    let employeeSnap = await getDoc(employeeDocRef);

    if (employeeSnap.exists()) {
      return mapFirestoreDocToEmployeeData(employeeSnap.data(), employeeSnap.id);
    } else {
      const q = query(collection(db, EMPLOYEES_COLLECTION), where("employeeId", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0];
        return mapFirestoreDocToEmployeeData(employeeDoc.data(), employeeDoc.id);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching employee by ID ${id}: `, error);
    throw new Error("Failed to fetch employee data from Firestore.");
  }
}

async function uploadEmployeePhotograph(photoFile: File, employeeId: string): Promise<string> {
    const filePath = `employee_photos/${employeeId}/${Date.now()}_${photoFile.name}`;
    // Reusing the generic uploader service
    return uploadStudentPhoto(photoFile, filePath);
}

async function deletePhotograph(photographUrl: string): Promise<void> {
  if (!photographUrl || photographUrl.includes("placehold.co")) {
    return;
  }
  // Logic to delete from Supabase/Firebase Storage
}


export async function registerEmployee(
  employeeData: Omit<EmployeeData, 'id' | 'registrationDate' | 'photographUrl' | 'printHistory' | 'photograph'> & { photograph?: File | null, photographUrl?: string | null, employeeType: EmployeeType }
): Promise<EmployeeData> {
  try {
    const q = query(collection(db, EMPLOYEES_COLLECTION), where("employeeId", "==", employeeData.employeeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`Employee with ID ${employeeData.employeeId} already exists.`);
    }

    let finalPhotographUrl = employeeData.photographUrl || "https://placehold.co/80x100.png";
    if (employeeData.photograph instanceof File) {
      finalPhotographUrl = await uploadEmployeePhotograph(employeeData.photograph, employeeData.employeeId);
    }
    
    const docDataToSave: any = {
      fullName: employeeData.fullName,
      address: employeeData.address || 'N/A',
      mobileNumber: employeeData.mobileNumber || 'N/A',
      employeeId: employeeData.employeeId,
      sevarthNo: employeeData.sevarthNo || '',
      designation: employeeData.designation,
      employeeType: employeeData.employeeType,
      photographUrl: finalPhotographUrl,
      registrationDate: serverTimestamp(),
      printHistory: [],
      cardHolderSignature: employeeData.cardHolderSignature,
      isOrganDonor: employeeData.isOrganDonor || false,
    };
    if (employeeData.dateOfBirth) docDataToSave.dateOfBirth = Timestamp.fromDate(new Date(employeeData.dateOfBirth));
    if (employeeData.bloodGroup) docDataToSave.bloodGroup = employeeData.bloodGroup;

    const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), docDataToSave);
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) throw new Error("Failed to retrieve newly created employee.");
    
    return mapFirestoreDocToEmployeeData(newDocSnap.data(), newDocSnap.id);

  } catch (error) {
    console.error("Error registering employee: ", error);
    throw new Error(error instanceof Error ? error.message : "An unexpected error occurred during registration.");
  }
}

export async function updateEmployee(
  employeeDocId: string,
  dataToUpdate: Partial<Omit<EmployeeData, 'id' | 'registrationDate' | 'photograph'>>,
  newPhotographFile?: File | null,
  existingPhotographUrl?: string | null
): Promise<EmployeeData> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeDocId);
    let finalPhotographUrl = existingPhotographUrl;

    if (newPhotographFile instanceof File) {
      if (existingPhotographUrl && !existingPhotographUrl.includes("placehold.co")) {
        await deletePhotograph(existingPhotographUrl);
      }
      finalPhotographUrl = await uploadEmployeePhotograph(newPhotographFile, dataToUpdate.employeeId!);
    }
    
    const updatePayload: any = { ...dataToUpdate };
    if (finalPhotographUrl !== undefined) updatePayload.photographUrl = finalPhotographUrl;
    if (dataToUpdate.dateOfBirth) {
      updatePayload.dateOfBirth = Timestamp.fromDate(new Date(dataToUpdate.dateOfBirth));
    }
    
    await updateDoc(employeeDocRef, updatePayload);

    const updatedDocSnap = await getDoc(employeeDocRef);
    if (!updatedDocSnap.exists()) throw new Error("Failed to retrieve updated employee.");
    return mapFirestoreDocToEmployeeData(updatedDocSnap.data(), updatedDocSnap.id);

  } catch (error) {
    console.error("Error updating employee: ", error);
    throw new Error("Failed to update employee details.");
  }
}

export async function deleteEmployee(employeeDocId: string, photographUrl?: string): Promise<void> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeDocId);
    if (photographUrl) await deletePhotograph(photographUrl);
    await deleteDoc(employeeDocRef);
  } catch (error) {
    console.error("Error deleting employee: ", error);
    throw new Error("Failed to delete employee.");
  }
}

export async function bulkRegisterEmployees(employeesData: Partial<EmployeeData>[]): Promise<{ successCount: number; errors: string[] }> {
  const batch = writeBatch(db);
  const errors: string[] = [];
  let successCount = 0;

  const idsInBatch = new Set<string>();

  for (const data of employeesData) {
    if (!data.employeeId) {
      errors.push(`Skipping employee with missing ID: ${data.fullName || 'Unknown Name'}`);
      continue;
    }
    if (idsInBatch.has(data.employeeId)) {
      errors.push(`Duplicate Employee ID ${data.employeeId} in this batch for ${data.fullName}. Skipped.`);
      continue;
    }

    const q = query(collection(db, EMPLOYEES_COLLECTION), where("employeeId", "==", data.employeeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      errors.push(`Employee with ID ${data.employeeId} (${data.fullName || 'N/A'}) already exists. Skipped.`);
      continue;
    }
    
    const employeeDocRef = doc(collection(db, EMPLOYEES_COLLECTION));
    idsInBatch.add(data.employeeId);

    const employeeToSave: any = {
      ...data,
      registrationDate: serverTimestamp(),
      printHistory: [],
      photographUrl: data.photographUrl || "https://placehold.co/80x100.png",
      sevarthNo: data.sevarthNo || '',
      isOrganDonor: data.isOrganDonor || false,
    };

    if (data.dateOfBirth) {
        employeeToSave.dateOfBirth = Timestamp.fromDate(new Date(data.dateOfBirth));
    }

    batch.set(employeeDocRef, employeeToSave);
    successCount++;
  }

  try {
    await batch.commit();
    return { successCount, errors };
  } catch (error) {
    console.error("Error committing bulk employee registration: ", error);
    errors.push(`Batch commit failed: ${error instanceof Error ? error.message : String(error)}`);
    return { successCount: 0, errors };
  }
}

export async function recordEmployeeCardPrint(employeeId: string, printedBy: string): Promise<void> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    
    const newPrintEntry = {
      printDate: Timestamp.now(),
      printedBy: printedBy || 'System'
    };

    await updateDoc(employeeDocRef, {
      printHistory: arrayUnion(newPrintEntry)
    });
  } catch (error) {
    console.error(`Error recording card print for employee ID ${employeeId}: `, error);
  }
}
