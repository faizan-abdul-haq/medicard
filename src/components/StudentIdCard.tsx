'use client';

import type { StudentData } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, QrCode, User, MapPin, Phone, Hash, CalendarDays, BookUser, Award } from 'lucide-react';
import { format } from 'date-fns';

interface StudentIdCardProps {
  student: StudentData;
}

export default function StudentIdCard({ student }: StudentIdCardProps) {
  const expiryDate = new Date(student.registrationDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary border-2 rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={32} />
          <CardTitle className="text-2xl">Student ID Card</CardTitle>
        </div>
         <Image src="https://placehold.co/80x80.png" alt="QR Code" width={60} height={60} className="rounded-md border-2 border-primary-foreground" data-ai-hint="qr code university" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24 border-2 border-primary rounded-md">
            <AvatarImage src={student.photographUrl || "https://placehold.co/100x120.png"} alt={student.fullName} data-ai-hint="student portrait" />
            <AvatarFallback>{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-primary">{student.fullName}</h2>
            <p className="text-sm text-muted-foreground">{student.courseName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem icon={<User size={16} className="text-accent"/>} label="Roll No." value={student.rollNumber} />
          <InfoItem icon={<Hash size={16} className="text-accent"/>} label="PRN No." value={student.prnNumber} />
          <InfoItem icon={<CalendarDays size={16} className="text-accent"/>} label="Date of Birth" value={student.dateOfBirth ? format(student.dateOfBirth, 'dd/MM/yyyy') : 'N/A'} />
          <InfoItem icon={<Phone size={16} className="text-accent"/>} label="Mobile" value={student.mobileNumber} />
          <InfoItem icon={<MapPin size={16} className="text-accent"/>} label="Address" value={student.address} className="col-span-1 sm:col-span-2" />
          <InfoItem icon={<BookUser size={16} className="text-accent"/>} label="Year of Joining" value={student.yearOfJoining} />
        </div>

        <div className="border-t border-border pt-3 mt-3">
           <InfoItem icon={<Award size={16} className="text-primary"/>} label="Issued Date" value={format(student.registrationDate, 'dd MMM, yyyy')} />
           <InfoItem icon={<CalendarDays size={16} className="text-destructive"/>} label="Expiry Date" value={format(expiryDate, 'dd MMM, yyyy')} />
        </div>

        <CardDescription className="text-xs text-center text-muted-foreground pt-2">
          This card is valid for 1 year from the date of printing.
          QR Code links to student's profile.
        </CardDescription>
      </CardContent>
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
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold text-foreground">{label}:</p>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}
