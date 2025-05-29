
'use client';

import React, { useEffect, useState } from 'react'; // Import React
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { StudentData } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStudentById } from '@/services/studentService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';


function StudentProfileContent({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');


  useEffect(() => {
    async function fetchStudentData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getStudentById(studentId);
        if (data) {
          // Ensure dates are Date objects
          setStudent({
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            registrationDate: new Date(data.registrationDate),
          });
        } else {
          setError(`Student with ID ${studentId} not found.`);
        }
      } catch (err) {
        console.error("Failed to fetch student data:", err);
        setError("Failed to load student data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudentData();
  }, [studentId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && student) {
      const currentUrl = window.location.href;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`);
    }
  }, [student]);


  if (isLoading) {
    return <div className="max-w-lg mx-auto text-center py-10"><p>Loading student profile...</p></div>;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <Card className="shadow-lg p-8 bg-destructive/10 border-destructive">
          <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/students/list">
            <Button variant="outline">
              Back to Student List
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!student) {
     // This case should be covered by error state, but as a fallback
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <Card className="shadow-lg p-8">
          <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
          <h2 className="text-2xl font-bold text-destructive mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The student profile could not be loaded.
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
                <AvatarImage src={student.photographUrl || "https://placehold.co/100x120.png"} alt={student.fullName} data-ai-hint="student portrait" className="object-cover"/>
                <AvatarFallback className="text-4xl">{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-3xl font-bold text-primary">{student.fullName}</h2>
              <p className="text-lg text-muted-foreground">{student.courseName}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p><strong>PRN Number:</strong> {student.prnNumber}</p>
                <p><strong>Roll Number:</strong> {student.rollNumber}</p>
                {student.dateOfBirth && isValid(student.dateOfBirth) && <p><strong>Date of Birth:</strong> {format(student.dateOfBirth, 'dd MMM, yyyy')}</p>}
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

          {qrCodeUrl && (
            <div className="mt-6 p-4 bg-accent/10 rounded-md text-center">
              <QrCode className="mx-auto mb-2 text-accent" size={48} />
              <p className="text-sm font-semibold text-accent-foreground">Digital Student Profile</p>
              <p className="text-xs text-muted-foreground">Student ID: {student.id}</p>
              <Image 
                src={qrCodeUrl}
                alt={`QR Code for ${student.fullName}'s profile`} 
                width={120} 
                height={120} 
                className="rounded-md border-2 border-primary-foreground mx-auto mt-2" 
                data-ai-hint="qr code profile"
                unoptimized // For dynamic external URLs
              />
               <p className="text-xs text-muted-foreground mt-1">Scan to verify this profile online.</p>
            </div>
          )}
          <div className="flex items-center justify-center mt-4 text-green-600">
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

// The prop `paramsInput` (renamed from `params` to avoid confusion with resolved `params`)
// is what Next.js passes to the page component. The error indicates this is a Promise.
export default function StudentProfilePage({ params: paramsInput }: { params: { id: string } /* Or Promise<{ id: string }> if type needs update */ }) {
  // Use React.use to unwrap the params promise, as suggested by the Next.js error.
  // This must be called unconditionally at the top level of the component.
  // We cast paramsInput to a Promise type based on the runtime error's message.
  const resolvedParams = React.use(paramsInput as unknown as Promise<{ id: string }>);

  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    // This check will occur after resolvedParams is available (due to React.use suspending if needed)
    // or if authIsLoading resolves faster.
    return <div className="flex justify-center items-center min-h-screen"><p>Loading profile...</p></div>;
  }
  
  // Now use resolvedParams.id
  return (
    <ProtectedRoute>
      <StudentProfileContent studentId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
