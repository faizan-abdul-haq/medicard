
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Download, TableIcon, UserCircle, AlertTriangle, Droplets, ArrowLeft } from "lucide-react";
import type { StudentData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, parseISO, parse } from 'date-fns';
import { bulkRegisterStudents } from '@/services/studentService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";

const MOBILE_REGEX = /^\d{10}$/;


function BulkUploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Partial<StudentData>[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const csvHeaders = [
    "fullName", "prnNumber", "rollNumber", "courseName", "yearOfJoining", "dateOfBirth", "cardHolderSignature",
    "bloodGroup", "mobileNumber", "address", "photographUrl"
  ];

  const placeholderSignatureUrl = "https://placehold.co/100x40.png?text=Signature";

  const csvTemplateString = csvHeaders.join(',') + '\n' +
    `"John Doe","PRN1001","R101","B.Sc. Computers","FIRST","2003-05-15","${placeholderSignatureUrl}","O+","9876543210","123 Main St, Anytown","https://placehold.co/100x120.png"` + '\n' +
    `"Jane Smith","PRN1002","R102","B.Com. Finance","SECOND","2002-11-20","${placeholderSignatureUrl}","A-","9876543212","456 Oak Ave, Otherville",""`;
  

  const requiredHeadersForParsing = ["fullName", "prnNumber", "rollNumber", "courseName", "yearOfJoining", "dateOfBirth"];

  const parseCSV = (csvText: string): Partial<StudentData>[] => {
    const students: Partial<StudentData>[] = [];
    const lines = csvText.trim().split('\n');
    const currentParsingErrors: string[] = [];

    if (lines.length < 2) {
        currentParsingErrors.push("CSV file must contain headers and at least one data row.");
        setUploadErrors(currentParsingErrors);
        toast({ title: "Invalid CSV", description: "CSV file must contain headers and at least one data row.", variant: "destructive" });
        return [];
    }

    const headersFromFile = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    for (const reqHeader of requiredHeadersForParsing) {
        if (!headersFromFile.includes(reqHeader)) {
            currentParsingErrors.push(`Missing required header: ${reqHeader}. Please use the template.`);
        }
    }
    if (currentParsingErrors.length > 0) {
        setUploadErrors(currentParsingErrors);
        toast({ title: "Invalid CSV Headers", description: currentParsingErrors.join(' '), variant: "destructive" });
        return [];
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const data = line.split(',').map(d => d.trim().replace(/^"|"$/g, ''));

      const student: Partial<StudentData> = {};
      let prnFound = false;
      let dobValid = false;
      let rowError = false;

      headersFromFile.forEach((header, index) => {
        const key = header as keyof StudentData;
        let value: any = data[index] || '';

        if (key === 'cardHolderSignature') {
        } else
        if (key === 'dateOfBirth') {
          let parsedDate = parseISO(value);
          if (!isValid(parsedDate)) {
             parsedDate = parse(value, 'MM/dd/yyyy', new Date());
             if (!isValid(parsedDate)) {
                parsedDate = parse(value, 'dd/MM/yyyy', new Date());
             }
          }
          if (isValid(parsedDate)) {
            value = parsedDate;
            dobValid = true;
          } else {
            currentParsingErrors.push(`Row ${i+1} (PRN: ${data[headersFromFile.indexOf("prnNumber")] || 'N/A'}): Invalid Date Format '${data[index]}'. Use YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY. Skipping record.`);
            value = undefined;
            rowError = true;
          }
        } else if (key === 'photographUrl' && !value) {
          value = "https://placehold.co/100x120.png";
        } else if (key === 'prnNumber' && value) {
          prnFound = true;
        } else if (key === 'mobileNumber' && value && !MOBILE_REGEX.test(value)) {
          currentParsingErrors.push(`Row ${i+1} (PRN: ${student.prnNumber || 'N/A'}): Invalid mobileNumber '${value}'. Must be 10 digits. Field will be cleared.`);
          value = '';
        }

        if (['yearOfJoining', 'rollNumber', 'bloodGroup'].includes(key)) {
            value = String(value);
        }
        (student as any)[key] = value;
      });

      if (rowError) continue;

      if (!prnFound || !student.prnNumber) {
        currentParsingErrors.push(`PRN number is missing for a student at row ${i + 1}. Skipping this record.`);
        continue;
      }
      if (!dobValid && requiredHeadersForParsing.includes('dateOfBirth')) {
         currentParsingErrors.push(`Date of Birth is invalid or missing for student with PRN ${student.prnNumber} at row ${i + 1}. Skipping this record.`);
        continue;
      }

      for(const reqHeader of requiredHeadersForParsing) {
        if (!student[reqHeader as keyof StudentData]) {
            currentParsingErrors.push(`Missing required field '${reqHeader}' for student with PRN ${student.prnNumber} at row ${i+1}. Skipping record.`);
            rowError = true;
            break;
        }
      }
      if(rowError) continue;

      students.push(student);
    }
    setUploadErrors(currentParsingErrors);
    return students;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadErrors([]);
    setParsedStudents([]);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (text) {
            const jsonData = parseCSV(text);
            setParsedStudents(jsonData);
            if (jsonData.length > 0 && uploadErrors.length === 0) {
                 toast({ title: "CSV Parsed Successfully", description: `${jsonData.length} student records ready for review.` });
            } else if (jsonData.length === 0 && uploadErrors.length === 0){
                 toast({ title: "No Data Found", description: "The CSV file seems empty or incorrectly formatted.", variant: "warning" });
            } else if (uploadErrors.length > 0 && jsonData.length > 0) {
                 toast({ title: "Parsing Issues Found", description: `CSV parsed with ${uploadErrors.length} issues. ${jsonData.length} valid records found. Review messages and data.`, variant: "warning" });
            } else if (uploadErrors.length > 0 && jsonData.length === 0) {
                 toast({ title: "Parsing Failed", description: `CSV could not be parsed due to ${uploadErrors.length} critical issues. No valid records found.`, variant: "destructive" });
            }
          }
        };
        reader.readAsText(selectedFile);
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a CSV file.", variant: "destructive" });
        setFile(null);
        setParsedStudents([]);
        if (e.target) e.target.value = '';
      }
    } else {
        setFile(null);
        setParsedStudents([]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parsedStudents.length === 0) {
      toast({
        title: "No Data to Upload",
        description: "Please select a CSV file and ensure valid student data is parsed.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const studentsToRegister = parsedStudents.filter(p =>
        p.prnNumber && p.fullName && p.rollNumber && p.courseName && p.yearOfJoining && p.dateOfBirth && isValid(new Date(p.dateOfBirth))
      ).map(p => ({
        ...p,
        fullName: p.fullName!,
        prnNumber: p.prnNumber!,
        rollNumber: p.rollNumber!,
        courseName: p.courseName!,
        yearOfJoining: p.yearOfJoining!,
        dateOfBirth: new Date(p.dateOfBirth!),
        bloodGroup: p.bloodGroup || undefined,
        address: p.address || "N/A",
        mobileNumber: (p.mobileNumber && MOBILE_REGEX.test(p.mobileNumber)) ? p.mobileNumber : undefined,
        photographUrl: p.photographUrl || "https://placehold.co/100x120.png",
        id: '',
        registrationDate: new Date(),
        cardHolderSignature: p.cardHolderSignature
      })) as StudentData[];


      if (studentsToRegister.length === 0) {
        toast({ title: "No Valid Students to Register", description: "All parsed records had critical missing information or errors. Please check parsing messages.", variant: "warning"});
        setIsUploading(false);
        return;
      }

      const result = await bulkRegisterStudents(studentsToRegister);

      let toastTitle = "Bulk Upload Processed";
      let toastVariant: "default" | "warning" | "destructive" = "default";
      const submissionErrors = result.errors;

      if (submissionErrors.length > 0 && result.successCount === 0) {
        toastTitle = "Bulk Upload Failed";
        toastVariant = "destructive";
      } else if (submissionErrors.length > 0) {
        toastTitle = "Bulk Upload Partially Successful";
        toastVariant = "warning";
      }

      toast({
        title: toastTitle,
        description: `${result.successCount} student(s) registered. ${submissionErrors.length} error(s) encountered during Firestore saving.`,
        variant: toastVariant,
        duration: submissionErrors.length > 0 ? 9000 : 5000,
      });

      setUploadErrors(prev => [...prev, ...submissionErrors]);

      if(result.successCount > 0) {
        setFile(null);
        setParsedStudents([]);
        const form = e.target as HTMLFormElement;
        form.reset();
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';

        if (submissionErrors.length === 0) setUploadErrors([]);
      }

    } catch (error) {
      console.error("Bulk upload submission failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during bulk upload.";
      setUploadErrors(prev => [...prev, errorMessage]);
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplateString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "student_upload_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
        toast({ title: "Download Failed", description: "Your browser does not support this download method.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud size={28} /> Bulk Student Upload
          </CardTitle>
          <CardDescription>Upload a CSV file to register multiple students. Review parsed data before final submission. Ensure PRN numbers are unique. Dates can be YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY. Phone numbers must be 10 digits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="csvFile" className="flex items-center gap-1 mb-1">
                <FileText size={16}/> CSV File
              </Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file:text-primary file:font-semibold"
              />
              {file && <p className="text-sm text-muted-foreground mt-2">Selected file: {file.name}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Download CSV Template
                </Button>
                <Button type="submit" className="w-full sm:flex-grow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUploading || parsedStudents.length === 0}>
                {isUploading ? 'Uploading...' : <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Register {parsedStudents.length > 0 ? `(${parsedStudents.length})` : ''} Students</>}
                </Button>
            </div>
          </form>

          {uploadErrors.length > 0 && (
            <Alert variant={parsedStudents.length > 0 && uploadErrors.some(e => !e.startsWith("Row") && !e.startsWith("Student with PRN") && !e.startsWith("Duplicate PRN")) ? "warning" : "destructive"} className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <ShadcnAlertTitle>Upload Issues</ShadcnAlertTitle>
              <ShadcnAlertDescription>
                <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                  {uploadErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </ShadcnAlertDescription>
            </Alert>
          )}

          {parsedStudents.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><TableIcon /> Parsed Student Data for Review ({parsedStudents.length} records)</CardTitle>
                <CardDescription>Verify the student data below. Students with unique PRNs will be registered. Required fields are marked with an asterisk in instructions. Invalid records may be skipped (check messages above).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>PRN</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Blood Group</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedStudents.map((student, index) => (
                        <TableRow key={student.prnNumber || index} className={(!student.prnNumber || !student.dateOfBirth || !isValid(new Date(student.dateOfBirth)) ) ? 'bg-destructive/10' : ''}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <UserCircle size={18} className="text-muted-foreground" />
                            {student.fullName || <span className="text-destructive">N/A</span>}
                          </TableCell>
                          <TableCell>{student.prnNumber || <span className="text-destructive">N/A</span>}</TableCell>
                           <TableCell>{(student.mobileNumber && MOBILE_REGEX.test(student.mobileNumber)) ? student.mobileNumber : <span className="text-orange-500">Invalid/Missing</span>}</TableCell>
                          <TableCell>{student.courseName || <span className="text-destructive">N/A</span>}</TableCell>
                          <TableCell>{student.dateOfBirth && isValid(new Date(student.dateOfBirth)) ? format(new Date(student.dateOfBirth), 'dd/MM/yyyy') : <span className="text-destructive">Invalid/Missing</span>}</TableCell>
                          <TableCell className="flex items-center gap-1">
                            {student.bloodGroup ? <Droplets size={16} className="text-red-600"/> : <span className="text-muted-foreground">N/A</span>}
                            {student.bloodGroup || ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50 p-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-lg">CSV Format Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
              <p>Ensure your CSV file has the following columns (matching the template):</p>
              <ul className="list-disc list-inside pl-4 columns-2 sm:columns-3">
                {csvHeaders.map(header => {
                  const isRequired = requiredHeadersForParsing.includes(header);
                  let typeHint = 'Text';
                  if (header === 'dateOfBirth') typeHint = 'Date';
                  else if (header === 'yearOfJoining') typeHint = 'Text (e.g. FIRST)';
                  else if (header === 'photographUrl') typeHint = 'Optional URL';
                  else if (header === 'mobileNumber') typeHint = '10-digit Phone';
                  return (
                    <li key={header}><code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">{header}</code>{isRequired ? <span className="text-destructive">*</span> : ""} ({typeHint})</li>
                  );
                })}
              </ul>
              <p className="mt-2"><span className="text-destructive">*</span>Required fields. PRN Number must be unique. Invalid dates or missing required fields will cause records to be skipped.</p>
              <p>The template includes example data. Date formats: YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY.</p>
              <p>For `photographUrl`, provide a direct URL to an image, or leave blank to use a default placeholder.</p>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="pt-6">
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function BulkUploadPage() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading bulk upload...</p></div>;
  }
  return (
    <ProtectedRoute>
      <BulkUploadContent />
    </ProtectedRoute>
  );
}
