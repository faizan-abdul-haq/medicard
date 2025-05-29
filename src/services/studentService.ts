
'use server'; // Can be used by server components if needed, but functions are async for client too

import { mockStudents as initialMockStudents } from '@/lib/mockStudents';
import type { StudentData } from '@/lib/types';

// In a real app, this would interact with a database or an external API.
// For now, we'll use an in-memory version of mockStudents that can be "modified".
let mockStudents: StudentData[] = [...initialMockStudents];

export async function getStudents(): Promise<StudentData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return JSON.parse(JSON.stringify(mockStudents)); // Return a copy
}

export async function getStudentById(id: string): Promise<StudentData | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const student = mockStudents.find(s => s.prnNumber === id || s.id === id);
  return student ? JSON.parse(JSON.stringify(student)) : null;
}

export async function registerStudent(studentData: Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'> & { photograph?: File | null, dateOfBirth: Date }): Promise<StudentData> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newStudent: StudentData = {
    ...studentData,
    id: studentData.prnNumber || `TEMP_ID_${Date.now()}`, // Use PRN or generate temp ID
    registrationDate: new Date(),
    // Simulate photograph URL if a file was "uploaded"
    photographUrl: studentData.photograph ? "https://placehold.co/100x120.png" : "https://placehold.co/100x120.png", 
  };

  // Add to our in-memory store
  mockStudents.push(newStudent);
  // In a real app, you'd get the ID from the database.
  console.log("Registered new student (simulated):", newStudent);
  return JSON.parse(JSON.stringify(newStudent));
}

export async function bulkRegisterStudents(studentsData: Partial<StudentData>[]): Promise<{ successCount: number; newStudents: StudentData[] }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newStudents: StudentData[] = [];
  studentsData.forEach(data => {
    const student: StudentData = {
      id: data.prnNumber || `TEMP_ID_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fullName: data.fullName || 'N/A',
      address: data.address || 'N/A',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('2000-01-01'), // Default DOB
      mobileNumber: data.mobileNumber || 'N/A',
      prnNumber: data.prnNumber || 'N/A_PRN',
      rollNumber: data.rollNumber || 'N/A_ROLL',
      yearOfJoining: data.yearOfJoining || new Date().getFullYear().toString(),
      courseName: data.courseName || 'N/A Course',
      photographUrl: data.photographUrl || "https://placehold.co/100x120.png",
      registrationDate: new Date(),
    };
    mockStudents.push(student);
    newStudents.push(student);
  });

  console.log(`Bulk registered ${newStudents.length} students (simulated)`);
  return { successCount: newStudents.length, newStudents: JSON.parse(JSON.stringify(newStudents)) };
}

// Helper to reset mock data if needed for testing during development
export async function resetMockStudents() {
    mockStudents = [...initialMockStudents];
}

