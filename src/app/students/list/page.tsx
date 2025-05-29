import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { mockStudents } from '@/lib/mockStudents';
import type { StudentData } from '@/lib/types';
import { format } from 'date-fns';
import { Users, Eye } from 'lucide-react';

export default function StudentListPage() {
  const students: StudentData[] = mockStudents;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Users size={28} /> Student Roster
          </CardTitle>
          <CardDescription>Browse all registered students in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PRN Number</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.prnNumber}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{student.courseName}</TableCell>
                    <TableCell>{format(student.registrationDate, 'dd MMM, yyyy')}</TableCell>
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
          ) : (
            <p className="text-muted-foreground text-center py-4">No students registered yet.</p>
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
