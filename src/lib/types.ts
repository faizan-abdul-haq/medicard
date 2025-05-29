
export interface StudentData {
  id: string; // Firestore document ID
  photograph?: File | null; // For upload form, not stored in Firestore directly
  photographUrl?: string; // URL to the photo from Firebase Storage or placeholder
  fullName: string;
  address: string;
  dateOfBirth: Date; // Always ensure this is a JS Date object in the application
  mobileNumber: string;
  prnNumber: string; // Should be unique
  rollNumber: string;
  yearOfJoining: string; // e.g., "FIRST", "SECOND", or "2023"
  courseName: string;
  bloodGroup?: string;
  registrationDate: Date; // Always ensure this is a JS Date object in the application
  printHistory?: Date[]; // Array of timestamps when the card was printed

  // New medical fields
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalConditions?: string;
}

export interface RecentRegistration {
  name: string;
  date: string; // Formatted date string
  profileLink: string;
  photographUrl?: string;
}

// Used for print preview page query parameters
export interface PrintPreviewParams {
  studentIds?: string; // Comma-separated string of PRN numbers
}
