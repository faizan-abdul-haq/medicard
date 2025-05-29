
'use client';

import type { StudentData } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Repeat, QrCodeIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface StudentIdCardProps {
  student: StudentData;
  showFlipButton?: boolean;
  initialSide?: 'front' | 'back';
}

export default function StudentIdCard({ student, showFlipButton = true, initialSide = 'front' }: StudentIdCardProps) {
  const [isFrontVisible, setIsFrontVisible] = useState(initialSide === 'front');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const collegeName = "GOVERNMENT MEDICAL COLLEGE &";
  const hospitalInfo = "GROUP OF HOSPITALS, MUMBAI 400008";
  const officePhoneNumber = "022-23735555";

  const registrationYear = student.registrationDate.getFullYear();
  const yearOfAdmission = `${registrationYear}-${registrationYear + 1}`;
  
  const validUptoDate = new Date(student.registrationDate);
  validUptoDate.setFullYear(validUptoDate.getFullYear() + 1);
  const validUptoString = format(validUptoDate, 'MMM yyyy');


  useEffect(() => {
    if (typeof window !== 'undefined' && student.prnNumber) {
      const profileUrl = `${window.location.origin}/students/${student.prnNumber}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(profileUrl)}&margin=0`);
    }
  }, [student.prnNumber]);

  const toggleCardSide = () => setIsFrontVisible(!isFrontVisible);

  const cardInstructions = [
    "This card must always be displayed while you are in premises & produced on demand for inspection.",
    "If found please return to office address.",
    "It is not transferrable & is the property of GGMC & Sir J.J. Hospital.",
    "Card validity: till you are at GGMC & Sir J.J. Hospital."
  ];

  const cardBaseClasses = "w-[330px] h-[210px] mx-auto shadow-xl rounded-lg overflow-hidden bg-white border border-gray-300 relative font-sans text-xs print:shadow-none print:border-gray-400";

  if (isFrontVisible) {
    return (
      <Card className={cardBaseClasses}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        {/* Blue Header */}
        <div className="bg-blue-700 text-white p-1.5 flex items-center">
          <div className="w-1/5 flex justify-center items-center">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div className="w-4/5 text-center leading-tight">
            <p className="font-semibold text-[10px] tracking-tighter">{collegeName}</p>
            <p className="text-[9px] tracking-tighter">{hospitalInfo}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <CardContent className="p-2 flex flex-row gap-2">
          {/* Left Side: Photo */}
          <div className="w-[80px] flex-shrink-0 mt-1">
            <Image 
              src={student.photographUrl || "https://placehold.co/80x100.png"} 
              alt={student.fullName} 
              width={80} 
              height={100} 
              className="object-cover border border-gray-400"
              data-ai-hint="student portrait"
              unoptimized
            />
          </div>

          {/* Right Side: Details */}
          <div className="flex-grow space-y-0.5 text-[10px]">
            <p className="font-bold text-[11px] text-black mb-1">{student.fullName}</p>
            
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center">
              <Label className="font-semibold text-gray-700">DOB</Label>
              <p className="text-gray-900">{student.dateOfBirth ? format(student.dateOfBirth, 'dd/MM/yyyy') : 'N/A'}</p>

              <Label className="font-semibold text-gray-700">Blood Group</Label>
              <p className="text-gray-900">{student.bloodGroup || 'N/A'}</p>

              <Label className="font-semibold text-gray-700">Course</Label>
              <p className="text-gray-900">{student.courseName}</p>

              <Label className="font-semibold text-gray-700">Year</Label>
              <p className="text-gray-900">{student.yearOfJoining}</p>
              
              <Label className="font-semibold text-gray-700">Roll No</Label>
              <p className="text-gray-900">{student.rollNumber}</p>

              <Label className="font-semibold text-gray-700">PRN No</Label>
              <p className="text-gray-900">{student.prnNumber}</p>
            </div>
          </div>
        </CardContent>

        {/* Footer Area */}
        <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between items-end text-[10px]">
          <p className="font-semibold text-gray-700">DEAN</p>
          <div className="text-center">
             <div className="w-20 h-6 border-b border-gray-400 mb-0.5 flex items-center justify-center italic text-gray-500">
               {/* Signature placeholder */}
             </div>
            <p className="font-semibold text-gray-700">Card Holder's Signature</p>
          </div>
        </div>
      </Card>
    );
  } else {
    // Back Side of the Card
    return (
      <Card className={cardBaseClasses}>
         {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        <CardContent className="p-2 space-y-1 text-[9px] leading-snug">
          <div className="flex justify-between items-start">
            <div>
              <p><span className="font-semibold">Year of Admission:</span> {yearOfAdmission}</p>
              <p><span className="font-semibold">Valid Upto:</span> {validUptoString}</p>
            </div>
            {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="QR Code for Profile" width={50} height={50} data-ai-hint="qr code profile" unoptimized className="border border-gray-300"/>
              ) : (
                <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center border border-gray-300">
                  <QrCodeIcon size={30} className="text-gray-500" />
                </div>
              )}
          </div>
          
          <div>
            <p className="font-semibold mt-1">Residential Address:</p>
            <p className="whitespace-pre-line text-[8.5px] leading-tight">{student.address || 'N/A'}</p>
          </div>

          <ol className="list-decimal list-inside space-y-0.5 mt-1 text-[8px] leading-tight">
            {cardInstructions.map((inst, idx) => <li key={idx}>{inst}</li>)}
          </ol>
          
          <div className="border-t border-gray-300 mt-auto pt-1 flex justify-between items-center text-[9px] absolute bottom-1 left-2 right-2">
            <p><span className="font-semibold">Mob:</span> {student.mobileNumber || 'N/A'}</p>
            <p><span className="font-semibold">Office:</span> {officePhoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
