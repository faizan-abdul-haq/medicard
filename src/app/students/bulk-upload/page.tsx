
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Download, TableIcon, UserCircle } from "lucide-react";
import type { StudentData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<StudentData[]>([]);
  const { toast } = useToast();

  const csvHeaders = [
    "fullName", "address", "dateOfBirth", "mobileNumber", 
    "prnNumber", "rollNumber", "yearOfJoining", "courseName", "photographUrl"
  ];
  const csvTemplateString = csvHeaders.join(',') + '\n' +
    "\"John Doe\",\"123 Main St, Anytown\",\"2003-05-15\",\"555-1234\",\"PRN1001\",\"R101\",\"2021\",\"B.Sc. Computers\",\"https://placehold.co/100x120.png\"\n" +
    "\"Jane Smith\",\"456 Oak Ave, Otherville\",\"2002-11-20\",\"555-5678\",\"PRN1002\",\"R102\",\"2020\",\"B.Com. Finance\",\"\"\n";


  const parseCSV = (csvText: string): StudentData[] => {
    const students: StudentData[] = [];
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        toast({ title: "Invalid CSV", description: "CSV file must contain headers and at least one data row.", variant: "destructive" });
        return [];
    }

    const headersFromFile = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Basic validation for required headers
    const requiredHeaders = ["fullName", "prnNumber", "rollNumber", "courseName"];
    for (const reqHeader of requiredHeaders) {
        if (!headersFromFile.includes(reqHeader)) {
            toast({ title: "Invalid CSV Headers", description: `Missing required header: ${reqHeader}. Please use the template.`, variant: "destructive" });
            return [];
        }
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      // This is a naive CSV parser, doesn't handle commas within quoted fields well.
      // For robust parsing, a library would be better.
      const data = line.split(',').map(d => d.trim().replace(/"/g, ''));
      
      const student: Partial<StudentData> = { registrationDate: new Date() };
      let prnFound = false;

      headersFromFile.forEach((header, index) => {
        const key = header as keyof StudentData;
        let value: any = data[index] || '';

        if (key === 'dateOfBirth') {
          value = value ? new Date(value) : undefined;
           if (value && isNaN(value.getTime())) { // Check for invalid date
            toast({ title: `Invalid Date Format for ${student.fullName || `row ${i+1}`}`, description: `Date of Birth '${data[index]}' is not valid. Use YYYY-MM-DD.`, variant: "destructive" });
            value = undefined;
          }
        } else if (key === 'photographUrl' && !value) {
          value = "https://placehold.co/100x120.png";
        } else if (key === 'prnNumber' && value) {
          prnFound = true;
        }
        
        // Ensure numeric fields are treated as strings as per StudentData type for year/roll
        if (key === 'yearOfJoining' || key === 'rollNumber') {
            value = String(value);
        }

        (student as any)[key] = value;
      });

      if (!prnFound || !student.prnNumber) {
        toast({ title: "Missing PRN", description: `PRN number is missing or invalid for a student at row ${i + 1}. Skipping this record.`, variant: "warning" });
        continue; 
      }
      
      student.id = student.prnNumber; // Use PRN as ID

      // Fill missing required fields with defaults or skip if critical
      if (!student.fullName) student.fullName = "N/A";
      if (!student.rollNumber) student.rollNumber = "N/A";
      if (!student.courseName) student.courseName = "N/A";
      if (!student.address) student.address = "N/A";
      if (!student.mobileNumber) student.mobileNumber = "N/A";
      if (!student.yearOfJoining) student.yearOfJoining = new Date().getFullYear().toString();


      students.push(student as StudentData);
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
            } else if (file) { // if file was selected but parsing resulted in 0 students and no error toast from parser yet
                 toast({ title: "No Data Found", description: "The CSV file seems empty or incorrectly formatted after headers.", variant: "warning" });
            }
          }
        };
        reader.readAsText(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
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
    if (!file && parsedStudents.length === 0) {
      toast({
        title: "No Data to Upload",
        description: "Please select a CSV file and ensure it's parsed.",
        variant: "destructive",
      });
      return;
    }
    if (parsedStudents.length === 0 && file) {
        toast({
          title: "No Parsed Students",
          description: "No valid student data was parsed from the file. Please check the CSV format or content.",
          variant: "destructive",
        });
        return;
    }


    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    setIsUploading(false);

    toast({
      title: "Upload Successful (Simulated)",
      description: `${parsedStudents.length} student records would be processed and ID cards generated.`,
    });
    setFile(null);
    setParsedStudents([]);
    const form = e.target as HTMLFormElement;
    form.reset(); 
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
        toast({
            title: "Download Failed",
            description: "Your browser does not support this download method.",
            variant: "destructive",
        });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud size={28} /> Bulk Student Upload
          </CardTitle>
          <CardDescription>Upload a CSV file to register multiple students. Review parsed data before final submission.</CardDescription>
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
                {isUploading ? 'Uploading...' : <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Register Students</>}
                </Button>
            </div>
          </form>

          {parsedStudents.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><TableIcon /> Parsed Student Data for Review</CardTitle>
                <CardDescription>Verify the student data below before submitting. Cards will be generated for these {parsedStudents.length} students.</CardDescription>
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
                        <TableHead>DOB</TableHead>
                        <TableHead>Mobile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedStudents.map((student, index) => (
                        <TableRow key={student.id || index}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <UserCircle size={18} className="text-muted-foreground" />
                            {student.fullName}
                          </TableCell>
                          <TableCell>{student.prnNumber}</TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>{student.courseName}</TableCell>
                          <TableCell>{student.dateOfBirth ? format(student.dateOfBirth, 'dd/MM/yyyy') : 'N/A'}</TableCell>
                          <TableCell>{student.mobileNumber}</TableCell>
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
              <p>Ensure your CSV file has the following columns in order (matching the template):</p>
              <ul className="list-disc list-inside pl-4 columns-2">
                {csvHeaders.map(header => (
                  <li key={header}><code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{header}</code> ({header === 'dateOfBirth' ? 'YYYY-MM-DD' : header === 'yearOfJoining' ? 'YYYY' : header === 'photographUrl' ? 'Optional URL' : 'Text'})</li>
                ))}
              </ul>
              <p className="mt-2">The first row must be headers. Data rows follow. PRN Number is mandatory for each student.</p>
              <p>The template includes example data.</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
