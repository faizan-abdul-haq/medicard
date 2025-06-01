
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck, AlertTriangle, Printer, History, Mail, Phone, Home, CalendarDays, Droplets, HeartPulse, Users as UsersIcon, HelpCircle, PhoneCall, Loader2, ArrowLeft, SettingsIcon } from "lucide-react";
import Image from "next/image";
import type { StudentData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { format, isValid, addMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getStudentById } from '@/services/studentService';
import { getCardSettings } from '@/services/cardSettingsService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import StudentIdCard from '@/components/StudentIdCard';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

function StudentProfileContent({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchStudentData() {
      setIsLoadingStudent(true);
      setError(null);
      try {
        const data = await getStudentById(studentId);
        if (data) {
          setStudent({
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined as any,
            registrationDate: data.registrationDate ? new Date(data.registrationDate) : new Date(),
            printHistory: data.printHistory ? data.printHistory.map(ph => new Date(ph)) : [],
          });
        } else {
          setError(`Student with identifier ${studentId} not found.`);
        }
      } catch (err) {
        console.error("Failed to fetch student data:", err);
        setError("Failed to load student data.");
        toast({ title: "Error", description: "Failed to load student data.", variant: "destructive" });
      } finally {
        setIsLoadingStudent(false);
      }
    }
    fetchStudentData();
  }, [studentId, toast]);

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        const fetchedSettings = await getCardSettings();
        setCardSettings(fetchedSettings);
      } catch (error) {
        toast({ title: "Error Loading Card Settings", description: "Failed to fetch card settings for preview. Using defaults.", variant: "destructive" });
        setCardSettings(DEFAULT_CARD_SETTINGS);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, [toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && student) {
      const currentUrl = `${window.location.origin}/students/${student.prnNumber}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`);
    }
  }, [student]);


  if (isLoadingStudent || isLoadingSettings) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2"/>
        <p className="text-lg font-semibold text-muted-foreground">
          {isLoadingStudent ? "Loading student profile..." : "Loading card settings..."}
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
          <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
          <h2 className="text-2xl font-bold text-destructive mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The student profile could not be loaded.
          </p>
          <Button variant="outline" onClick={() => router.push('/students/list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
          </Button>
        </Card>
      </div>
    );
  }

  const expiryDate = student.registrationDate ? addMonths(new Date(student.registrationDate), cardSettings.validityPeriodMonths) : new Date();


  const DetailItem = ({ icon, label, value, classNameText }: { icon: React.ReactNode, label: string, value?: string | null, classNameText?: string }) => (
    value ? (
      <div className="flex items-start gap-2">
        <span className="text-primary">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className={`font-semibold text-foreground whitespace-pre-wrap ${classNameText || ''}`}>{value}</p>
        </div>
      </div>
    ) : null
  );


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-xl border-primary border-2 rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <User size={24} /> Student Digital Profile
          </CardTitle>
           <CardDescription className="text-primary-foreground/80 font-semibold">Comprehensive overview of student details and ID card status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 text-center">
              <Avatar className="h-36 w-36 md:h-40 md:w-40 border-4 border-primary rounded-lg mx-auto">
                <AvatarImage src={student.photographUrl || "https://placehold.co/160x160.png"} alt={student.fullName} data-ai-hint="student portrait" className="object-cover"/>
                <AvatarFallback className="text-4xl">{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {qrCodeUrl && (
                <div className="mt-4 p-3 bg-accent/10 rounded-md text-center">
                  <QrCode className="mx-auto mb-1 text-accent" size={32} />
                  <p className="text-xs font-bold text-foreground">Profile QR</p>
                  <Image
                    src={qrCodeUrl}
                    alt={`QR Code for ${student.fullName}'s profile`}
                    width={80}
                    height={80}
                    className="rounded-md border-2 border-primary-foreground mx-auto mt-1"
                    data-ai-hint="qr code profile"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex-grow space-y-4 w-full">
              <h2 className="text-3xl font-bold text-primary text-center md:text-left">{student.fullName}</h2>
              <p className="text-lg text-muted-foreground font-semibold text-center md:text-left">{student.courseName} ({student.yearOfJoining} Year)</p>

              <Separator/>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <DetailItem icon={<User size={16}/>} label="PRN Number" value={student.prnNumber} />
                <DetailItem icon={<User size={16}/>} label="Roll Number" value={student.rollNumber} />
                {student.dateOfBirth && isValid(student.dateOfBirth) &&
                  <DetailItem icon={<CalendarDays size={16}/>} label="Date of Birth" value={format(student.dateOfBirth, 'dd MMM, yyyy')} />}
                <DetailItem icon={<Phone size={16}/>} label="Mobile" value={student.mobileNumber} />
                <DetailItem icon={<Droplets size={16}/>} label="Blood Group" value={student.bloodGroup} />
                <DetailItem icon={<CalendarDays size={16}/>} label="Registration Date" value={student.registrationDate ? format(student.registrationDate, 'dd MMM, yyyy HH:mm') : 'N/A'}/>
                <DetailItem icon={<CalendarDays size={16}/>} label="ID Expiry Date" value={student.registrationDate ? format(expiryDate, 'dd MMM, yyyy') : 'N/A'} classNameText="font-bold text-destructive" />
              </div>
               <DetailItem icon={<Home size={16}/>} label="Address" value={student.address} />
            </div>
          </div>

          <Separator/>

          <div>
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2"><HeartPulse size={20}/> Medical Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <DetailItem icon={<UsersIcon size={16}/>} label="Emergency Contact Name" value={student.emergencyContactName} />
                <DetailItem icon={<PhoneCall size={16}/>} label="Emergency Contact Phone" value={student.emergencyContactPhone} />
            </div>
            <DetailItem icon={<AlertTriangle size={16}/>} label="Allergies" value={student.allergies} />
            <DetailItem icon={<HelpCircle size={16}/>} label="Known Medical Conditions" value={student.medicalConditions} />
          </div>

          <div className="flex items-center justify-center mt-4 text-green-600">
            <ShieldCheck size={20} className="mr-2"/>
            <p className="font-bold">Verified Student Record</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">ID Card Preview</CardTitle>
          <CardDescription className="font-semibold">Interactive preview of the student's ID card.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-4">
          <StudentIdCard student={student} settings={cardSettings} showFlipButton={true} initialSide="front" />
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
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {student.printHistory.map((printDate, index) => (
                <li key={index} className="font-semibold">{isValid(printDate) ? format(printDate, 'dd MMM, yyyy HH:mm:ss') : 'Invalid Date'}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="text-center pt-4 space-x-2">
        <Button variant="outline" size="lg" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <Link href="/students/list">
            <Button variant="secondary" size="lg">
              Full Student List
            </Button>
        </Link>
      </div>
    </div>
  );
}

export default function StudentProfilePage({ params: paramsInput }: { params: { id: string } }) {
  const resolvedParams = React.use(paramsInput as unknown as Promise<{ id: string }>);
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg font-semibold">Loading authentication...</p></div>;
  }

  return (
    <ProtectedRoute>
      <StudentProfileContent studentId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
