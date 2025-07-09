
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Download, TableIcon, UserCircle, AlertTriangle, ArrowLeft, Briefcase } from "lucide-react";
import type { EmployeeData, EmployeeType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, parseISO, parse } from 'date-fns';
import { bulkRegisterEmployees } from '@/services/employeeService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";

const MOBILE_REGEX = /^\d{10}$/;

function BulkUploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedEmployees, setParsedEmployees] = useState<Partial<EmployeeData>[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const csvHeaders = [
    "fullName", "employeeId", "department", "designation", "employeeType", "dateOfJoining",
    "mobileNumber", "address", "bloodGroup", "photographUrl", "cardHolderSignature"
  ];

  const csvTemplateString = csvHeaders.join(',') + '\n' +
    `"Dr. Jane Doe","EMP001","Computer Science","Professor","FACULTY","2020-08-15","9876543210","123 Faculty Row, Knowledge City","O+","https://placehold.co/100x120.png",""` + '\n' +
    `"John Smith","EMP002","Administration","Office Clerk","STAFF","2021-02-01","9876543211","456 Staff Quarters, Service Town","A+","https://placehold.co/100x120.png",""`;
  
  const requiredHeadersForParsing = ["fullName", "employeeId", "department", "designation", "employeeType", "dateOfJoining"];

  const parseCSV = (csvText: string): Partial<EmployeeData>[] => {
    const employees: Partial<EmployeeData>[] = [];
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

      const employee: Partial<EmployeeData> = {};
      let rowError = false;

      headersFromFile.forEach((header, index) => {
        const key = header as keyof EmployeeData;
        let value: any = data[index] || '';

        if (key === 'dateOfJoining') {
          let parsedDate = parseISO(value);
          if (!isValid(parsedDate)) parsedDate = parse(value, 'MM/dd/yyyy', new Date());
          if (!isValid(parsedDate)) parsedDate = parse(value, 'dd/MM/yyyy', new Date());

          if (isValid(parsedDate)) {
            value = parsedDate;
          } else {
            currentParsingErrors.push(`Row ${i+1} (ID: ${data[headersFromFile.indexOf("employeeId")] || 'N/A'}): Invalid Date Format '${data[index]}'. Skipping record.`);
            value = undefined;
            rowError = true;
          }
        } else if (key === 'employeeType' && value !== 'FACULTY' && value !== 'STAFF') {
            currentParsingErrors.push(`Row ${i+1} (ID: ${data[headersFromFile.indexOf("employeeId")] || 'N/A'}): Invalid employeeType '${value}'. Must be 'FACULTY' or 'STAFF'. Skipping record.`);
            rowError = true;
        } else if (key === 'mobileNumber' && value && !MOBILE_REGEX.test(value)) {
          currentParsingErrors.push(`Row ${i+1} (ID: ${employee.employeeId || 'N/A'}): Invalid mobileNumber '${value}'. Must be 10 digits. Field will be cleared.`);
          value = '';
        }

        (employee as any)[key] = value;
      });

      if (rowError) continue;
      
      for(const reqHeader of requiredHeadersForParsing) {
        if (!employee[reqHeader as keyof EmployeeData]) {
            currentParsingErrors.push(`Missing required field '${reqHeader}' for employee with ID ${employee.employeeId} at row ${i+1}. Skipping record.`);
            rowError = true;
            break;
        }
      }
      if(rowError) continue;

      employees.push(employee);
    }
    setUploadErrors(currentParsingErrors);
    return employees;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadErrors([]);
    setParsedEmployees([]);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (text) {
            const jsonData = parseCSV(text);
            setParsedEmployees(jsonData);
             if (jsonData.length > 0 && uploadErrors.length === 0) {
                 toast({ title: "CSV Parsed Successfully", description: `${jsonData.length} employee records ready for review.` });
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
        if (e.target) e.target.value = '';
      }
    } else {
        setFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parsedEmployees.length === 0) {
      toast({ title: "No Data to Upload", description: "Please select a valid CSV file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const result = await bulkRegisterEmployees(parsedEmployees as any[]);

      const toastVariant = result.errors.length > 0 ? (result.successCount === 0 ? "destructive" : "warning") : "default";
      toast({
        title: "Bulk Upload Processed",
        description: `${result.successCount} employee(s) registered. ${result.errors.length} error(s) encountered.`,
        variant: toastVariant,
        duration: result.errors.length > 0 ? 9000 : 5000,
      });

      setUploadErrors(prev => [...prev, ...result.errors]);

      if(result.successCount > 0) {
        setFile(null);
        setParsedEmployees([]);
        const form = e.target as HTMLFormElement;
        form.reset();
        if (result.errors.length === 0) setUploadErrors([]);
      }

    } catch (error) {
      console.error("Bulk upload submission failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setUploadErrors(prev => [...prev, errorMessage]);
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplateString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud size={28} /> Bulk Employee Upload
          </CardTitle>
          <CardDescription>Upload a CSV file to register multiple employees. Employee IDs must be unique. `employeeType` must be either "FACULTY" or "STAFF".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="csvFile" className="flex items-center gap-1 mb-1"><FileText size={16}/> CSV File</Label>
              <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
              {file && <p className="text-sm text-muted-foreground mt-2">Selected file: {file.name}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Download CSV Template
                </Button>
                <Button type="submit" className="w-full sm:flex-grow bg-accent hover:bg-accent/90" disabled={isUploading || parsedEmployees.length === 0}>
                {isUploading ? 'Uploading...' : <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Register {parsedEmployees.length > 0 ? `(${parsedEmployees.length})` : ''} Employees</>}
                </Button>
            </div>
          </form>

          {uploadErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <ShadcnAlertTitle>Upload Issues</ShadcnAlertTitle>
              <ShadcnAlertDescription><ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">{uploadErrors.map((err, idx) => <li key={idx}>{err}</li>)}</ul></ShadcnAlertDescription>
            </Alert>
          )}

          {parsedEmployees.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><TableIcon /> Parsed Employee Data ({parsedEmployees.length})</CardTitle><CardDescription>Review parsed data. Invalid records will be skipped.</CardDescription></CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Employee ID</TableHead><TableHead>Type</TableHead><TableHead>Department</TableHead><TableHead>Joining Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {parsedEmployees.map((emp, index) => (
                        <TableRow key={emp.employeeId || index}>
                          <TableCell className="font-medium flex items-center gap-2"><UserCircle size={18} className="text-muted-foreground" />{emp.fullName}</TableCell>
                          <TableCell>{emp.employeeId}</TableCell>
                          <TableCell>{emp.employeeType}</TableCell>
                          <TableCell>{emp.department}</TableCell>
                          <TableCell>{emp.dateOfJoining && isValid(new Date(emp.dateOfJoining)) ? format(new Date(emp.dateOfJoining), 'dd/MM/yyyy') : 'Invalid'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="pt-6"><Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></CardFooter>
      </Card>
    </div>
  );
}

export default function BulkUploadPage() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }
  return (
    <ProtectedRoute>
      <BulkUploadContent />
    </ProtectedRoute>
  );
}
