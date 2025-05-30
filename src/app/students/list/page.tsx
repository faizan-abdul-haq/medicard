
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudentData } from '@/lib/types';
import { format } from 'date-fns';
import { Users, Eye, Search, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { getStudents } from '@/services/studentService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

function StudentListContent() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchStudents() {
      setIsLoading(true);
      try {
        const data = await getStudents();
        setStudents(data.sort((a,b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prnNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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


  if (isLoading) {
    return <p className="text-center py-4">Loading students...</p>;
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or PRN..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              {selectedStudents.size > 0 && (
                <Button asChild>
                  <Link href={`/print-preview?studentIds=${Array.from(selectedStudents).join(',')}`} target="_blank">
                    <Printer size={16} className="mr-2" /> Print ({selectedStudents.size})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedStudents.length > 0 ? (
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
                          aria-label={`Select student ${student.fullName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.prnNumber}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.courseName}</TableCell>
                      <TableCell>{format(new Date(student.registrationDate), 'dd MMM, yyyy')}</TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/students/${student.prnNumber}`}>
                            <Eye size={16} className="mr-1" /> View
                          </Link>
                        </Button>
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
                  </Button>
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
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {searchTerm ? "No students match your search." : "No students registered yet."}
            </p>
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
