
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Download, TableIcon, UserCircle, AlertTriangle } from "lucide-react";
import type { StudentData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, parseISO } from 'date-fns';
import { bulkRegisterStudents } from '@/services/studentService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";


function BulkUploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Partial<StudentData>[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const csvHeaders = [
    "fullName", "address", "dateOfBirth", "mobileNumber", 
    "prnNumber", "rollNumber", "yearOfJoining", "courseName", "photographUrl"
  ];
  const csvTemplateString = csvHeaders.join(',') + '\n' +
    "\"John Doe\",\"123 Main St, Anytown\",\"2003-05-15\",\"555-1234\",\"PRN1001\",\"R101\",\"2021\",\"B.Sc. Computers\",\"https://placehold.co/100x120.png\"\n" +
    "\"Jane Smith\",\"456 Oak Ave, Otherville\",\"2002-11-20\",\"555-5678\",\"PRN1002\",\"R102\",\"2020\",\"B.Com. Finance\",\"\"\n";

  const parseCSV = (csvText: string): Partial<StudentData>[] => {
    const students: Partial<StudentData>[] = [];
    const lines = csvText.trim().split('\n');
    setUploadErrors([]); // Clear previous errors
    
    if (lines.length < 2) {
        toast({ title: "Invalid CSV", description: "CSV file must contain headers and at least one data row.", variant: "destructive" });
        return [];
    }

    const headersFromFile = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const requiredHeadersPresent = ["fullName", "prnNumber", "rollNumber", "courseName", "yearOfJoining", "dateOfBirth"];
    for (const reqHeader of requiredHeadersPresent) {
        if (!headersFromFile.includes(reqHeader)) {
            toast({ title: "Invalid CSV Headers", description: `Missing required header: ${reqHeader}. Please use the template.`, variant: "destructive" });
            return [];
        }
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; 

      const data = line.split(',').map(d => d.trim().replace(/"/g, ''));
      
      const student: Partial<StudentData> = {};
      let prnFound = false;
      let dobValid = false;

      headersFromFile.forEach((header, index) => {
        const key = header as keyof StudentData; // Be mindful of this cast
        let value: any = data[index] || '';

        if (key === 'dateOfBirth') {
          const parsedDate = parseISO(value); // Expects YYYY-MM-DD
          if (isValid(parsedDate)) {
            value = parsedDate;
            dobValid = true;
          } else {
            toast({ title: `Invalid Date Format for row ${i+1}`, description: `Date of Birth '${data[index]}' is not valid. Use YYYY-MM-DD. Record will be skipped.`, variant: "warning" });
            value = undefined; 
          }
        } else if (key === 'photographUrl' && !value) {
          value = "https://placehold.co/100x120.png"; // Default placeholder
        } else if (key === 'prnNumber' && value) {
          prnFound = true;
        }
        
        if (key === 'yearOfJoining' || key === 'rollNumber') {
            value = String(value);
        }
        (student as any)[key] = value;
      });

      if (!prnFound || !student.prnNumber) {
        toast({ title: "Missing PRN", description: `PRN number is missing for a student at row ${i + 1}. Skipping this record.`, variant: "warning" });
        continue; 
      }
      if (!dobValid) {
         toast({ title: "Invalid Date of Birth", description: `Date of Birth is invalid or missing for student with PRN ${student.prnNumber} at row ${i + 1}. Skipping this record.`, variant: "warning" });
        continue;
      }
      
      // student.id is not set here, Firestore will generate it
      students.push(student);
    }
    return students;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
            if (jsonData.length > 0) {
                 toast({ title: "CSV Parsed Successfully", description: `${jsonData.length} student records ready for review.` });
            } else if (file) { 
                 toast({ title: "No Valid Data Found", description: "The CSV file seems empty, incorrectly formatted, or all records had critical errors.", variant: "warning" });
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
    setUploadErrors([]);
    try {
      // Ensure all required fields for Firestore are present, even if with defaults from parsing
      const studentsToRegister = parsedStudents.map(p => ({
        ...p,
        fullName: p.fullName || "N/A",
        prnNumber: p.prnNumber!, // Already validated in parseCSV
        rollNumber: p.rollNumber || "N/A",
        courseName: p.courseName || "N/A",
        yearOfJoining: p.yearOfJoining || new Date().getFullYear().toString(),
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : new Date('2000-01-01'), // Ensure it's a Date
        address: p.address || "N/A",
        mobileNumber: p.mobileNumber || "N/A",
        photographUrl: p.photographUrl || "https://placehold.co/100x120.png",
      })) as StudentData[];


      const result = await bulkRegisterStudents(studentsToRegister);
      toast({
        title: "Bulk Upload Processed",
        description: `${result.successCount} student records registered. ${result.errors.length} errors.`,
      });
      if (result.errors.length > 0) {
        setUploadErrors(result.errors);
      }
      setFile(null);
      setParsedStudents([]);
      const form = e.target as HTMLFormElement;
      form.reset(); 
      const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Bulk upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during bulk upload.";
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud size={28} /> Bulk Student Upload
          </CardTitle>
          <CardDescription>Upload a CSV file to register multiple students. Review parsed data before final submission. Ensure PRN numbers are unique.</CardDescription>
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
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <ShadcnAlertTitle>Upload Errors</ShadcnAlertTitle>
              <ShadcnAlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {uploadErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </ShadcnAlertDescription>
            </Alert>
          )}

          {parsedStudents.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><TableIcon /> Parsed Student Data for Review</CardTitle>
                <CardDescription>Verify the student data below. Students with unique PRNs will be registered. Required: fullName, prnNumber, rollNumber, courseName, yearOfJoining, dateOfBirth (YYYY-MM-DD).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>PRN</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>DOB (YYYY-MM-DD)</TableHead>
                        <TableHead>Mobile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedStudents.map((student, index) => (
                        <TableRow key={student.prnNumber || index}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <UserCircle size={18} className="text-muted-foreground" />
                            {student.fullName || 'N/A'}
                          </TableCell>
                          <TableCell>{student.prnNumber || 'N/A'}</TableCell>
                          <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                          <TableCell>{student.courseName || 'N/A'}</TableCell>
                          <TableCell>{student.dateOfBirth && isValid(new Date(student.dateOfBirth)) ? format(new Date(student.dateOfBirth), 'yyyy-MM-dd') : 'Invalid/Missing'}</TableCell>
                          <TableCell>{student.mobileNumber || 'N/A'}</TableCell>
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
              <ul className="list-disc list-inside pl-4 columns-2">
                {csvHeaders.map(header => (
                  <li key={header}><code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{header}</code> ({header === 'dateOfBirth' ? 'YYYY-MM-DD' : header === 'yearOfJoining' ? 'YYYY' : header === 'photographUrl' ? 'Optional URL' : 'Text'})</li>
                ))}
              </ul>
              <p className="mt-2">The first row must be headers. Data rows follow. PRN Number is mandatory and must be unique for each student. Required fields are: fullName, prnNumber, rollNumber, courseName, yearOfJoining, dateOfBirth.</p>
              <p>The template includes example data.</p>
            </CardContent>
          </Card>
        </CardContent>
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
