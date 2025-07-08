
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
  cardHolderSignature?: string;
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

export interface CardSettingsData {
  id?: string; // Firestore document ID, e.g., 'default_settings'
  collegeNameLine1: string;
  collegeNameLine2: string;
  headerBackgroundColor: string; // e.g., 'hsl(231, 48%, 48%)' or '#3F51B5'
  headerTextColor: string;     // e.g., 'hsl(210, 40%, 98%)' or '#E3F2FD'
  importantInfoBackgroundColor: string; // e.g., 'hsl(231, 48%, 90%)' or '#C5CAE9'
  deanTitle: string;
  officePhoneNumber: string;
  validityPeriodMonths: number; // e.g., 12 for 1 year
  logoUrl: string; // URL for the college logo
  deanSignatureUrl: string; // URL for the dean's signature
  instructionLine1: string;
  instructionLine2: string;
  instructionLine3: string;
  instructionLine4: string;
  defaultCardHolderSignatureText: string; // e.g., "Card Holder's Signature"
  cardFontFamily: string;
  cardFontSize: number; // Base font size in pixels
}

export const DEFAULT_CARD_SETTINGS: CardSettingsData = {
  collegeNameLine1: "GOVERNMENT MEDICAL COLLEGE &",
  collegeNameLine2: "GROUP OF HOSPITALS, MUMBAI 400008",
  headerBackgroundColor: "hsl(221, 83%, 53%)", // A vibrant blue
  headerTextColor: "hsl(0, 0%, 100%)",       // White
  importantInfoBackgroundColor: "hsl(220, 70%, 95%)", // Very light blue
  deanTitle: "DEAN",
  officePhoneNumber: "022-23735555",
  validityPeriodMonths: 12, // 1 year
  logoUrl: "https://placehold.co/160x160.png", // Path to a logo in the public folder
  deanSignatureUrl: "", // Dean's signature will be uploaded
  instructionLine1: "This card must always be displayed while you are in premises & produced on demand for inspection.",
  instructionLine2: "If found please return to office address.",
  instructionLine3: "It is not transferrable & is the property of GGMC & Sir J.J. Hospital.",
  instructionLine4: "Card validity: till you are at GGMC & Sir J.J. Hospital.",
  defaultCardHolderSignatureText: "Card Holder's Signature",
  cardFontFamily: "'Trebuchet MS', Helvetica, sans-serif",
  cardFontSize: 11, // Default base font size
};
