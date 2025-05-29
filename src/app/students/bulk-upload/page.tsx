
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Download } from "lucide-react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const csvHeaders = [
    "fullName", "address", "dateOfBirth", "mobileNumber", 
    "prnNumber", "rollNumber", "yearOfJoining", "courseName", "photographUrl"
  ];
  const csvTemplateString = csvHeaders.join(',') + '\n';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        setFile(null);
        if (e.target) e.target.value = ''; // Reset file input
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);

    // In a real app, you would process the CSV file here.
    // For now, we'll just show a success message.
    toast({
      title: "Upload Successful (Simulated)",
      description: `${file.name} has been processed. ${Math.floor(Math.random() * 50) + 10} students would be added.`,
    });
    setFile(null);
    const form = e.target as HTMLFormElement;
    form.reset(); 
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplateString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud size={28} /> Bulk Student Upload
          </CardTitle>
          <CardDescription>Upload a CSV file to register multiple students at once. Download the template for the correct format.</CardDescription>
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
                required 
              />
              {file && <p className="text-sm text-muted-foreground mt-2">Selected file: {file.name}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Download CSV Template
                </Button>
                <Button type="submit" className="w-full sm:flex-grow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUploading || !file}>
                {isUploading ? 'Uploading...' : <><UploadCloud className="mr-2 h-4 w-4" /> Upload CSV & Register</>}
                </Button>
            </div>
          </form>
          <Card className="bg-muted/50 p-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-lg">CSV Format Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
              <p>Ensure your CSV file has the following columns in order (matching the template):</p>
              <ul className="list-disc list-inside pl-4">
                {csvHeaders.map(header => (
                  <li key={header}><code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{header}</code> ({header === 'dateOfBirth' ? 'YYYY-MM-DD' : header === 'yearOfJoining' ? 'YYYY' : header === 'photographUrl' ? 'Optional URL' : 'Text'})</li>
                ))}
              </ul>
              <p className="mt-2">The first row should be headers. Data rows follow.</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
