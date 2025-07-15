
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { EmployeeData, EmployeeType } from '@/lib/types';
import { format } from 'date-fns';
import { Users, Eye, Search, ChevronLeft, ChevronRight, Printer, Download, Trash2, Loader2, Briefcase } from 'lucide-react';
import { getEmployees, deleteEmployee } from '@/services/employeeService';
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
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

function EmployeeListContent() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const fetchEmployeesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch employee list.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployeesData();
  }, [fetchEmployeesData]);
  
  const handleFilterChange = (newFilter: 'faculty' | 'staff' | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter) {
      params.set('filter', newFilter);
    } else {
      params.delete('filter');
    }
    router.push(`${pathname}?${params.toString()}`);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const filteredEmployees = useMemo(() => {
    let employeesToFilter = employees;

    if (filter === 'faculty' || filter === 'staff') {
      employeesToFilter = employees.filter(emp => emp.employeeType.toLowerCase() === filter);
    }
    
    if (!searchTerm) return employeesToFilter;

    return employeesToFilter.filter(emp =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.sevarthNo && emp.sevarthNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm, filter]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const handleSelectEmployee = (employeeId: string, checked: boolean | 'indeterminate') => {
    setSelectedEmployees(prev => {
      const newSelected = new Set(prev);
      if (checked === true) newSelected.add(employeeId);
      else newSelected.delete(employeeId);
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedEmployees(new Set(paginatedEmployees.map(e => e.id)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const isAllSelectedOnPage = paginatedEmployees.length > 0 && paginatedEmployees.every(e => selectedEmployees.has(e.id));
  const isSomeSelectedOnPage = paginatedEmployees.some(e => selectedEmployees.has(e.id)) && !isAllSelectedOnPage;

  const handleDeleteEmployee = async (employeeId: string, photographUrl?: string) => {
    setIsDeleting(employeeId);
    try {
      await deleteEmployee(employeeId, photographUrl);
      toast({ title: "Employee Deleted" });
      fetchEmployeesData();
      setSelectedEmployees(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(employeeId);
        return newSelected;
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete employee.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleDownloadCSV = () => {
    if (filteredEmployees.length === 0) {
      toast({ title: "No Data", description: "No employees to download.", variant: "warning" });
      return;
    }

    const headers = [
      "ID No.", "SEVARTH No.", "Full Name", "Type", "Designation", "Date of Birth",
      "Registration Date", "Mobile Number", "Address", "Blood Group", "Organ Donor", 
      "Photograph URL", "Signature URL"
    ];
    const csvRows = [headers.join(',')];

    filteredEmployees.forEach(emp => {
      const row = [
        `"${emp.employeeId}"`,
        `"${emp.sevarthNo || ''}"`,
        `"${emp.fullName}"`,
        `"${emp.employeeType}"`,
        `"${emp.designation}"`,
        `"${emp.dateOfBirth ? format(new Date(emp.dateOfBirth), 'yyyy-MM-dd') : ''}"`,
        `"${format(new Date(emp.registrationDate), 'yyyy-MM-dd HH:mm')}"`,
        `"${emp.mobileNumber || ''}"`,
        `"${(emp.address || '').replace(/"/g, '""')}"`,
        `"${emp.bloodGroup || ''}"`,
        `"${emp.isOrganDonor ? 'TRUE' : 'FALSE'}"`,
        `"${emp.photographUrl || ''}"`,
        `"${emp.cardHolderSignature || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV Downloaded", description: `${filteredEmployees.length} employee records exported.`});
  };

  const EmployeeTypeBadge = ({ type }: { type: EmployeeType }) => {
    const typeStyles = {
      FACULTY: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300",
      STAFF: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300",
    };
    return <Badge variant="outline" className={`font-semibold ${typeStyles[type]}`}>{type.charAt(0) + type.slice(1).toLowerCase()}</Badge>;
  };

  if (isLoading && employees.length === 0) {
    return <div className="flex justify-center items-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading employees...</p></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Briefcase size={28} /> Employee Roster</CardTitle>
              <CardDescription>Browse all registered employees. Found {filteredEmployees.length} records.</CardDescription>
            </div>
             <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Button onClick={() => handleFilterChange(null)} variant={!filter ? "default" : "outline"} size="sm">All</Button>
              <Button onClick={() => handleFilterChange('faculty')} variant={filter === 'faculty' ? "default" : "outline"} size="sm">Faculty</Button>
              <Button onClick={() => handleFilterChange('staff')} variant={filter === 'staff' ? "default" : "outline"} size="sm">Staff</Button>
            </div>
          </div>
           <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap pt-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="search" placeholder="Search employees..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 w-full" />
              </div>
              {selectedEmployees.size > 0 && (
                <Button asChild>
                  <Link href={`/print-preview?employeeIds=${Array.from(selectedEmployees).join(',')}`} target="_blank"><Printer size={16} className="mr-2" /> Print ({selectedEmployees.size})</Link>
                </Button>
              )}
               <Button onClick={handleDownloadCSV} variant="outline" disabled={filteredEmployees.length === 0}>
                  <Download size={16} className="mr-2" /> Download CSV
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {paginatedEmployees.length === 0 ? (
             <p className="text-center py-4">{searchTerm ? "No employees match your search." : "No employees registered yet."}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage ? true : (isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={handleSelectAll} /></TableHead>
                    <TableHead>ID No.</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id} data-state={selectedEmployees.has(employee.id) ? "selected" : undefined}>
                      <TableCell><Checkbox checked={selectedEmployees.has(employee.id)} onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked)} /></TableCell>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell><EmployeeTypeBadge type={employee.employeeType} /></TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell className="space-x-1">
                        <Button asChild variant="outline" size="sm"><Link href={`/employees/${employee.id}`}><Eye size={16} className="mr-1" /> View/Edit</Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={isDeleting === employee.id}>{isDeleting === employee.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {employee.fullName} (ID No: {employee.employeeId}).</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteEmployee(employee.id, employee.photographUrl)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="text-center mt-8">
        <Link href="/employees/register"><Button size="lg" className="bg-accent hover:bg-accent/90"><Briefcase className="mr-2" /> Register New Employee</Button></Link>
      </div>
    </div>
  );
}

export default function EmployeeListPage() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }
  return (
    <ProtectedRoute>
      <EmployeeListContent />
    </ProtectedRoute>
  );
}

    
