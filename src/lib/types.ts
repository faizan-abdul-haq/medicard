
export interface StudentData {
  id: string; // Could be PRN or a generated UUID
  photograph?: File | null; // For upload
  photographUrl?: string; // For display after "upload" or from mock/service
  fullName: string;
  address: string;
  dateOfBirth: Date | undefined; // Keep as Date object
  mobileNumber: string;
  prnNumber: string;
  rollNumber: string;
  yearOfJoining: string;
  courseName: string;
  registrationDate: Date; // Keep as Date object
}

export interface RecentRegistration {
  name: string;
  date: string;
  profileLink: string;
  photographUrl?: string;
}

