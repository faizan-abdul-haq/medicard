
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck, AlertTriangle, Printer, History, Mail, Phone, Home, CalendarDays, Droplets, Loader2, ArrowLeft, SettingsIcon, Edit3, Trash2 } from "lucide-react";
import Image from "next/image";
import type { StudentData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { format, isValid, addMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getStudentById, deleteStudent } from '@/services/studentService'; 
import { getCardSettings } from '@/services/cardSettingsService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import StudentIdCard from '@/components/StudentIdCard';
import StudentEditForm from '@/components/StudentEditForm';
import { Separator } from '@/components/ui/separator';
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


function StudentProfileContent({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchStudentAndSettingsData = useCallback(async () => {
    setIsLoadingStudent(true);
    setIsLoadingSettings(true);
    setError(null);
    try {
      const [studentData, settingsData] = await Promise.all([
        getStudentById(studentId),
        getCardSettings('student')
      ]);

      if (studentData) {
        setStudent({
          ...studentData,
        });
      } else {
        setError(`Student with identifier ${studentId} not found.`);
      }
      setCardSettings(settingsData || DEFAULT_CARD_SETTINGS);

    } catch (err) {
      console.error("Failed to fetch student data or settings:", err);
      setError("Failed to load student data or settings.");
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setIsLoadingStudent(false);
      setIsLoadingSettings(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    fetchStudentAndSettingsData();
  }, [fetchStudentAndSettingsData]);


  useEffect(() => {
    if (typeof window !== 'undefined' && student) {
      const currentUrl = `${window.location.origin}/students/${student.prnNumber}`; // Use PRN for QR
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`);
    }
  }, [student]);

  const handleUpdateSuccess = (updatedStudent: StudentData) => {
    setStudent(updatedStudent);
    setIsEditing(false);
    toast({ title: "Profile Updated", description: `${updatedStudent.fullName}'s profile has been successfully updated.` });
  };

  const handleDeleteConfirmed = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      await deleteStudent(student.id, student.photographUrl);
      toast({ title: "Student Deleted", description: `${student.fullName}'s record has been removed.` });
      router.push('/students/list');
    } catch (err) {
      console.error("Failed to delete student:", err);
      toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
      setIsDeleting(false);
    }
  };


  if (isLoadingStudent || isLoadingSettings) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2"/>
        <p className="text-lg font-semibold text-muted-foreground">
          {isLoadingStudent ? "Loading student profile..." : isLoadingSettings ? "Loading settings..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <Card className="shadow-lg p-8 bg-destructive/10 border-destructive">
          <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push('/students/list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
          </Button>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
       <div className="max-w-lg mx-auto text-center py-10">
        <Card className="shadow-lg p-8">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The student profile for the given ID could not be found.
          </p>
          <Button variant="outline" onClick={() => router.push('/students/list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
          </Button>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <StudentEditForm 
        studentToEdit={student} 
        onUpdateSuccess={handleUpdateSuccess}
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  const expiryDate = student.registrationDate ? addMonths(new Date(student.registrationDate), cardSettings.validityPeriodMonths) : new Date();

  const DetailItem = ({ icon, label, value, classNameText }: { icon: React.ReactNode, label: string, value?: string | null, classNameText?: string }) => (
    value || value === '' ? ( // Allow empty string for fields like allergies
      <div className="flex items-start gap-2 py-1">
        <span className="text-primary mt-0.5">{icon}</span>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={`font-semibold text-foreground whitespace-pre-wrap ${classNameText || ''}`}>{value || <span className="italic text-muted-foreground/70">N/A</span>}</p>
        </div>
      </div>
    ) : null
  );


  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
       <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Student
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete Student
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {student.fullName} (PRN: {student.prnNumber})? This action is permanent and will also remove their photograph.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting} className="bg-destructive hover:bg-destructive/80">
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

      <Card className="shadow-xl border-primary/50 border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary/10 p-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
            <User size={24} /> Student Digital Profile
          </CardTitle>
           <CardDescription className="font-semibold text-primary/80">Comprehensive overview of student details and ID card status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 text-center">
              <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-primary/30 rounded-lg mx-auto">
                <AvatarImage src={student.photographUrl || "https://placehold.co/160x160.png"} alt={student.fullName} data-ai-hint="student portrait" className="object-cover"/>
                <AvatarFallback className="text-4xl">{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {qrCodeUrl && (
                <div className="mt-3 p-2 bg-muted/30 rounded-md text-center">
                  <QrCode className="mx-auto mb-1 text-primary/70" size={24} />
                  <p className="text-xs font-bold text-foreground">Profile QR</p>
                  <Image
                    src={qrCodeUrl}
                    alt={`QR Code for ${student.fullName}'s profile`}
                    width={70}
                    height={70}
                    className="rounded-sm border border-primary/20 mx-auto mt-1"
                    data-ai-hint="qr code profile"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex-grow space-y-3 w-full">
              <h2 className="text-2xl font-bold text-primary text-center md:text-left">{student.fullName}</h2>
              <p className="text-md text-muted-foreground font-semibold text-center md:text-left">{student.courseName} ({student.yearOfJoining} Year)</p>
              <Separator/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <DetailItem icon={<User size={14}/>} label="PRN Number" value={student.prnNumber} />
                <DetailItem icon={<User size={14}/>} label="Roll Number" value={student.rollNumber} />
                {student.dateOfBirth && isValid(student.dateOfBirth) &&
                  <DetailItem icon={<CalendarDays size={14}/>} label="Date of Birth" value={format(student.dateOfBirth, 'dd MMM, yyyy')} />}
                <DetailItem icon={<Phone size={14}/>} label="Mobile" value={student.mobileNumber} />
                <DetailItem icon={<Droplets size={14}/>} label="Blood Group" value={student.bloodGroup} />
                <DetailItem icon={<CalendarDays size={14}/>} label="Registration Date" value={student.registrationDate ? format(student.registrationDate, 'dd MMM, yyyy HH:mm') : 'N/A'}/>
                <DetailItem icon={<CalendarDays size={14}/>} label="ID Expiry Date" value={student.registrationDate ? format(expiryDate, 'dd MMM, yyyy') : 'N/A'} classNameText="font-bold text-destructive" />
              </div>
               <DetailItem icon={<Home size={14}/>} label="Address" value={student.address} />
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-3 text-green-600">
            <ShieldCheck size={18} className="mr-2"/>
            <p className="font-semibold text-sm">Verified Student Record</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">ID Card Preview</CardTitle>
          <CardDescription className="font-semibold">Interactive preview of the student's ID card (reflects saved settings).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center p-4 gap-4">
            <div className="text-center">
                <StudentIdCard student={student} settings={cardSettings} showFlipButton={true} initialSide="front" />
            </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
           <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground">
            <Link href={`/print-preview?studentIds=${student.prnNumber}`} target="_blank">
              <Printer className="mr-2 h-4 w-4" /> Print ID Card
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {student.printHistory && student.printHistory.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary"><History /> ID Card Print History</CardTitle>
            <CardDescription className="font-semibold">This card was generated for printing on the following dates:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground max-h-40 overflow-y-auto">
              {[...student.printHistory].sort((a, b) => b.printDate.getTime() - a.printDate.getTime()).map((entry, index) => (
                <li key={index} className="font-semibold">
                  {isValid(entry.printDate) ? format(entry.printDate, 'dd MMM, yyyy HH:mm:ss') : 'Invalid Date'}
                  <span className="text-xs font-normal ml-2 text-muted-foreground/80">(by: {entry.printedBy})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudentProfilePage({ params: paramsInput }: { params: { id: string } }) {
  // This hook is essential for Client Components accessing route params
  const resolvedParams = React.use(paramsInput as unknown as Promise<{ id: string }>);
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg font-semibold">Loading authentication...</p></div>;
  }
  
  // Pass the unwrapped studentId to the content component
  return (
    <ProtectedRoute>
      <StudentProfileContent studentId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
