
'use client';

import type { StudentData } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, User, MapPin, Phone, Hash, CalendarDays, BookUser, Award, Repeat, Info, Signature } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface StudentIdCardProps {
  student: StudentData;
}

export default function StudentIdCard({ student }: StudentIdCardProps) {
  const expiryDate = new Date(student.registrationDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const [baseUrl, setBaseUrl] = useState('');
  const [showFront, setShowFront] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);
  
  const studentProfileUrl = baseUrl && student.prnNumber ? `${baseUrl}/students/${student.prnNumber}` : '';
  const qrCodeApiUrl = studentProfileUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(studentProfileUrl)}` : "https://placehold.co/80x80.png";

  const universityName = "MediCard University"; // Placeholder

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary border-2 rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background relative">
      {showFront ? (
        <>
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope size={28} />
              <CardTitle className="text-xl">{universityName}</CardTitle>
            </div>
            <Image 
              src={qrCodeApiUrl} 
              alt={`QR Code for ${student.fullName}`} 
              width={50} 
              height={50} 
              className="rounded-md border-2 border-primary-foreground" 
              data-ai-hint="qr code profile"
              unoptimized={!!studentProfileUrl}
            />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-center text-lg font-semibold text-primary -mt-2 mb-2">Student ID Card</p>
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-28 w-28 border-2 border-primary rounded-md">
                <AvatarImage src={student.photographUrl || "https://placehold.co/100x120.png"} alt={student.fullName} data-ai-hint="student portrait" />
                <AvatarFallback className="text-3xl">{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-primary">{student.fullName}</h2>
                <p className="text-md text-muted-foreground">{student.courseName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-3">
              <InfoItem icon={<Hash size={16} className="text-accent"/>} label="PRN No." value={student.prnNumber} />
              <InfoItem icon={<User size={16} className="text-accent"/>} label="Roll No." value={student.rollNumber} />
              <InfoItem icon={<CalendarDays size={16} className="text-destructive"/>} label="Expiry Date" value={format(expiryDate, 'dd MMM, yyyy')} />
              <InfoItem icon={<Award size={16} className="text-primary"/>} label="Issued" value={format(student.registrationDate, 'dd MMM, yyyy')} />
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader className="bg-muted text-muted-foreground p-3 text-center">
            <CardTitle className="text-lg flex items-center justify-center gap-2"><Info size={20}/> Student Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3 text-sm">
            <InfoItem icon={<CalendarDays size={16} className="text-accent"/>} label="Date of Birth" value={student.dateOfBirth ? format(student.dateOfBirth, 'dd MMM, yyyy') : 'N/A'} />
            <InfoItem icon={<Phone size={16} className="text-accent"/>} label="Mobile" value={student.mobileNumber} />
            <InfoItem icon={<MapPin size={16} className="text-accent"/>} label="Address" value={student.address} className="col-span-1 sm:col-span-2" />
            <InfoItem icon={<BookUser size={16} className="text-accent"/>} label="Year of Joining" value={student.yearOfJoining} />
            
            <div className="border-t border-border pt-3 mt-3 space-y-2">
                <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Student Signature:</Label>
                    <div className="w-full h-10 border-b border-dashed border-foreground/50 mt-1 flex items-center justify-center">
                        {/* Placeholder for signature, or could be an uploaded image if that feature is added */}
                        <Signature size={20} className="text-muted-foreground/50"/> 
                    </div>
                </div>
                <CardDescription className="text-xs text-center text-muted-foreground pt-2">
                This card is the property of {universityName}. If found, please return to the admin office. Valid for 1 year from issue date.
                {studentProfileUrl && !showFront ? " QR on front." : ""}
                </CardDescription>
            </div>
          </CardContent>
        </>
      )}
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="icon" onClick={() => setShowFront(!showFront)} className="text-primary-foreground bg-primary/50 hover:bg-primary/70 h-7 w-7">
          <Repeat size={16} />
          <span className="sr-only">Flip Card</span>
        </Button>
      </div>
    </Card>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

function InfoItem({ icon, label, value, className }: InfoItemProps) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-foreground text-xs">{label}:</p>
        <p className="text-muted-foreground break-words text-sm">{value}</p>
      </div>
    </div>
  );
}

