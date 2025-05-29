export interface StudentData {
  id: string; // Could be PRN or a generated UUID
  photograph?: File | null;
  photographUrl?: string; // For display after "upload"
  fullName: string;
  address: string;
  dateOfBirth: Date | undefined;
  mobileNumber: string;
  prnNumber: string;
  rollNumber: string;
  yearOfJoining: string;
  courseName: string;
  registrationDate: Date;
}
