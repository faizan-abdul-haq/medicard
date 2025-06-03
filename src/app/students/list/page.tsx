
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudentData, CardSettingsData } from '@/lib/types'; // Import CardSettingsData
import { format, addMonths, isBefore, startOfMonth, endOfMonth } from 'date-fns'; // Import date-fns functions
import { Users, Eye, Search, ChevronLeft, ChevronRight, Printer, Download, Trash2, Loader2 } from 'lucide-react';
import { getStudents, deleteStudent } from '@/services/studentService';
import { getCardSettings } from '@/services/cardSettingsService';
 // Import service to fetch settings
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSearchParams } from 'next/navigation';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types'; // Assuming you have a default settings

const ITEMS_PER_PAGE = 10;

function StudentListContent() {

  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of student being deleted
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS); // State for card settings
  const { toast } = useToast();

  const fetchStudentsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, settings] = await Promise.all([ // Fetch students and settings concurrently
        getStudents(),
        getCardSettings()
      ]);
      setStudents(data.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
      setCardSettings(settings); // Set the fetched settings
    } catch (error) {
      console.error("Failed to fetch students or settings:", error);
      toast({ title: "Error", description: "Failed to fetch student list or settings.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  const filteredStudents = useMemo(() => {
    let studentsToFilter = students;

    // Apply filter based on URL parameter
    if (filter === 'active' && cardSettings.validityPeriodMonths) {
      const now = new Date();
      studentsToFilter = studentsToFilter.filter(student => {
        // Ensure registrationDate is a valid Date object
        const registrationDate = new Date(student.registrationDate);
        if (!isNaN(registrationDate.getTime())) {
          const expiryDate = addMonths(registrationDate, cardSettings.validityPeriodMonths);
          return isBefore(now, expiryDate);
        }
        return false; // Exclude if registrationDate is invalid
      });
    } else if (filter === 'expiring' && cardSettings.validityPeriodMonths) {
      const now = new Date();
      const nextMonthStart = startOfMonth(addMonths(now, 1));
      const nextMonthEnd = endOfMonth(addMonths(now, 1));
      studentsToFilter = studentsToFilter.filter(student => {
         // Ensure registrationDate is a valid Date object
        const registrationDate = new Date(student.registrationDate);
         if (!isNaN(registrationDate.getTime())) {
            const expiryDate = addMonths(registrationDate, cardSettings.validityPeriodMonths);
            return isBefore(expiryDate, nextMonthEnd) && isBefore(nextMonthStart, expiryDate);
         }
         return false; // Exclude if registrationDate is invalid
      });
    }
    // If filter is not 'active' or 'expiring', or if validityPeriodMonths is not set, studentsToFilter remains the original students array

    // Apply search term filter to the potentially filtered list
    if (!searchTerm) {
      return studentsToFilter;
    }

    return studentsToFilter.filter(student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.courseName && student.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, searchTerm, filter, cardSettings]); // Add filter and cardSettings as dependencies

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  
const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSelectStudent = (prnNumber: string, checked: boolean | 'indeterminate') => {
    setSelectedStudents(prev => {
      const newSelected = new Set(prev);
      if (checked === true) {
        newSelected.add(prnNumber);
      } else {
        newSelected.delete(prnNumber);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allPrns = new Set(paginatedStudents.map(s => s.prnNumber));
      setSelectedStudents(allPrns);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const isAllSelectedOnPage = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.has(s.prnNumber));
  const isSomeSelectedOnPage = paginatedStudents.some(s => selectedStudents.has(s.prnNumber)) && !isAllSelectedOnPage;

  const handleDeleteStudent = async (studentId: string, photographUrl?: string) => {
    setIsDeleting(studentId);
    try {
      await deleteStudent(studentId, photographUrl);
      toast({ title: "Student Deleted", description: "The student record has been removed." });
      fetchStudentsData(); // Refetch students to update the list
      setSelectedStudents(prev => { // Remove from selection if deleted
        const newSelected = new Set(prev);
        const studentToDelete = students.find(s => s.id === studentId);
        if(studentToDelete) newSelected.delete(studentToDelete.prnNumber);
        return newSelected;
      });
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast({
 title: "Error", description: "Failed to delete student.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      toast({ title: "No Data", description: "No students to download.", variant: "warning" });
      return;
    }

    const headers = [
      "PRN Number", "Full Name", "Course", "Year of Joining", "Roll Number",
      "Registration Date", "Date of Birth", "Mobile Number", "Address",
      "Blood Group", "Emergency Contact Name", "Emergency Contact Phone",
      "Allergies", "Medical Conditions", "Photograph URL"
    ];
    const csvRows = [headers.join(',')];

    filteredStudents.forEach(student => {
      const row = [
        `"${student.prnNumber}"`,
        `"${student.fullName}"`,
        `"${student.courseName || ''}"`,
        `"${student.yearOfJoining}"`,
        `"${student.rollNumber}"`,
        `"${format(new Date(student.registrationDate), 'yyyy-MM-dd HH:mm')}"`,
        `"${student.dateOfBirth ? format(new Date(student.dateOfBirth), 'yyyy-MM-dd') : ''}"`,
        `"${student.mobileNumber || ''}"`,
        `"${(student.address || '').replace(/"/g, '""')}"`,
        `"${student.bloodGroup || ''}"`,
        `"${student.emergencyContactName || ''}"`,
        `"${student.emergencyContactPhone || ''}"`,
        `"${(student.allergies || '').replace(/"/g, '""')}"`,
        `"${(student.medicalConditions || '').replace(/"/g, '""')}"`,
        `"${student.photographUrl || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL
(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV Downloaded", description: `${filteredStudents.length} student records exported.`});
  };


  if (isLoading && students.length === 0) { // Show full page loader only on initial load
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading students...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Users size={28} /> Student Roster
              </CardTitle>
              <CardDescription>Browse all registered students. Found {filteredStudents.length} students.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, PRN, course..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              {selectedStudents.size > 0 && (
                <Button asChild>
                  <Link href={`/print-preview
?studentIds=${Array.from(selectedStudents).join(',')}`} target="_blank">
                    <Printer size={16} className="mr-2" /> Print ({selectedStudents.size})
                  </Link>
                </Button>
              )}
               <Button onClick={handleDownloadCSV} variant="outline" disabled={filteredStudents.length === 0}>
                  <Download size={16} className="mr-2" /> Download CSV
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && students.length > 0 && ( // Show subtle loading indicator when refetching
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          )}
          {!isLoading && paginatedStudents.length === 0 && (
             <p className="text-muted-foreground text-center py-4">
              {searchTerm ? "No students match your search." : "No students registered yet."}
            </p>
          )}
          {paginatedStudents.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelectedOnPage ? true : (isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all students on this page"
                      />
                    </TableHead>
                    <TableHead>PRN Number</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id} data-state={selectedStudents.has(student.prnNumber) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.prnNumber)}
                          onCheckedChange={(checked) => handleSelectStudent(student.prnNumber, checked)}
                          aria-label={`Select
 student ${student.fullName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.prnNumber}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.courseName}</TableCell>
                      <TableCell>{format(new Date(student.registrationDate), 'dd MMM, yyyy')}</TableCell>
                      <TableCell className="space-x-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/students/${student.id}`}>
                            <Eye size={16} className="mr-1" /> View/Edit
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDeleting === student.id}>
                              {isDeleting === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the student record for {student.fullName} (PRN: {student.prnNumber}) and their associated photograph.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStudent(student.id, student.photographUrl)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </
Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="text-center mt-8">
        <Link href="/register">
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Register New Student
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function StudentListPage() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading student list...</p></div>;
  }
  return (
    <ProtectedRoute>
      <StudentListContent />
    </ProtectedRoute>
  );
}
