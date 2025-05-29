import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { mockStudents } from '@/lib/mockStudents'; // Import mock students
import type { StudentData } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getStudentData(id: string): Promise<StudentData | null> {
  // Simulate fetching data from mockStudents
  const student = mockStudents.find(s => s.prnNumber === id);
  if (student) {
    return {
      ...student,
      // Ensure there's always a photographUrl, even if it's a placeholder from mock or default
      photographUrl: student.photographUrl || "https://placehold.co/100x120.png",
      // Ensure dateOfBirth is a Date object if it exists, or undefined
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
      registrationDate: new Date(student.registrationDate), // Ensure it's a Date object
    };
  }
  return null; // Student not found
}

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = await getStudentData(params.id);

  if (!student) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <Card className="shadow-lg p-8">
          <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
          <h2 className="text-2xl font-bold text-destructive mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The student profile with ID <code className="bg-muted px-1 rounded">{params.id}</code> could not be found.
          </p>
          <Link href="/students/list">
            <Button variant="outline">
              Back to Student List
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const expiryDate = new Date(student.registrationDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-xl border-primary border-2 rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User size={24} /> Student Digital ID
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-primary rounded-lg">
                <AvatarImage src={student.photographUrl} alt={student.fullName} data-ai-hint="student portrait" className="object-cover"/>
                <AvatarFallback className="text-4xl">{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-3xl font-bold text-primary">{student.fullName}</h2>
              <p className="text-lg text-muted-foreground">{student.courseName}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p><strong>PRN Number:</strong> {student.prnNumber}</p>
                <p><strong>Roll Number:</strong> {student.rollNumber}</p>
                {student.dateOfBirth && <p><strong>Date of Birth:</strong> {format(student.dateOfBirth, 'dd MMM, yyyy')}</p>}
                <p><strong>Mobile:</strong> {student.mobileNumber}</p>
                <p className="whitespace-pre-wrap"><strong>Address:</strong> {student.address}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-primary">Year of Joining:</p>
              <p>{student.yearOfJoining}</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Registration Date:</p>
              <p>{format(student.registrationDate, 'dd MMM, yyyy')}</p>
            </div>
            <div>
              <p className="font-semibold text-destructive">ID Expiry Date:</p>
              <p>{format(expiryDate, 'dd MMM, yyyy')}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-accent/10 rounded-md text-center">
            <QrCode className="mx-auto mb-2 text-accent" size={48} />
            <p className="text-sm font-semibold text-accent-foreground">Digital Student Profile</p>
            <p className="text-xs text-muted-foreground">Student ID: {student.id}</p>
            <Image 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.href : ''}`} 
              alt={`QR Code for ${student.fullName}'s profile`} 
              width={120} 
              height={120} 
              className="rounded-md border-2 border-primary-foreground mx-auto mt-2" 
              data-ai-hint="qr code profile"
              unoptimized // For dynamic external URLs
            />
             <p className="text-xs text-muted-foreground mt-1">Scan to verify this profile online.</p>
          </div>
          <div className="flex items-center justify-center mt-4 text-green-600"> {/* Tailwind green */}
            <ShieldCheck size={20} className="mr-2"/>
            <p className="font-semibold">Verified Student Record</p>
          </div>
        </CardContent>
      </Card>
      <div className="text-center">
        <Link href="/students/list">
            <Button variant="outline">
              Back to Student List
            </Button>
          </Link>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  // Generate static paths for existing mock students
  return mockStudents.map((student) => ({
    id: student.prnNumber,
  }));
}
