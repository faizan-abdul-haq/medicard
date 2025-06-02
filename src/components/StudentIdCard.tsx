
'use client';

import type { StudentData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Repeat, QrCodeIcon } from 'lucide-react';
import { format, isValid, addMonths } from 'date-fns';
import { useState, useEffect } from 'react';

interface StudentIdCardProps {
  student: StudentData;
  settings?: CardSettingsData;
  showFlipButton?: boolean;
  initialSide?: 'front' | 'back';
}

export default function StudentIdCard({
  student,
  settings: propSettings,
  showFlipButton = true,
  initialSide = 'front'
}: StudentIdCardProps) {
  const [isFrontVisible, setIsFrontVisible] = useState(initialSide === 'front');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const settings = { ...DEFAULT_CARD_SETTINGS, ...propSettings };

  const registrationYear = student.registrationDate ? new Date(student.registrationDate).getFullYear() : new Date().getFullYear();
  // Calculate admissionYearEnd based on the validity period in months
  const admissionYearEnd = registrationYear + Math.ceil(settings.validityPeriodMonths / 12);
  const yearOfAdmissionDisplay = `${registrationYear}-${String(admissionYearEnd).slice(-2)}`;


  let validUptoString = 'N/A';
  if (student.registrationDate && isValid(new Date(student.registrationDate))) {
    const validUptoDate = addMonths(new Date(student.registrationDate), settings.validityPeriodMonths);
    validUptoString = format(validUptoDate, 'MMM yyyy');
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && student.prnNumber) {
      const profileUrl = `${window.location.origin}/students/${student.prnNumber}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(profileUrl)}&margin=0`);
    }
  }, [student.prnNumber]);

  useEffect(() => {
    if (!showFlipButton) {
      setIsFrontVisible(initialSide === 'front');
    } else {
        // When showFlipButton is true, allow initialSide to set the first view,
        // but subsequent flips are controlled by isFrontVisible state.
        setIsFrontVisible(initialSide === 'front');
    }
  }, [initialSide, showFlipButton]);

  const toggleCardSide = () => {
    if (showFlipButton) {
      setIsFrontVisible(!isFrontVisible);
    }
  };

  const cardBaseClasses = "w-[330px] h-[210px] mx-auto shadow-xl rounded-lg overflow-hidden bg-white border border-gray-300 relative text-xs print:shadow-none print:border-gray-400";
  const headerStyle = {
    backgroundColor: settings.headerBackgroundColor,
    color: settings.headerTextColor,
  };
  const importantInfoStyle = {
    backgroundColor: settings.importantInfoBackgroundColor,
  };

  const cardDynamicStyle = {
    fontFamily: settings.cardFontFamily,
  };

  if (isFrontVisible) {
    return (
      <Card className={cardBaseClasses} style={cardDynamicStyle}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        <div style={headerStyle} className="p-1.5 flex items-center">
          <div className="w-1/5 flex justify-center items-center">
            <Image 
              src={settings.logoUrl || 'https://placehold.co/30x30.png'} 
              alt="College Logo" 
              width={30} 
              height={30} 
              data-ai-hint="college logo" 
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/30x30.png')} 
              unoptimized
            />
          </div>
          <div className="w-4/5 text-center leading-tight">
            <p className="font-semibold text-[10px] tracking-tighter">{settings.collegeNameLine1}</p>
            <p className="font-semibold text-[9px] tracking-tighter">{settings.collegeNameLine2}</p>
          </div>
        </div>

        <CardContent className="p-2 flex flex-row gap-2">
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
          <div className="flex-grow space-y-0.5 text-[10px]">
            <div style={{...importantInfoStyle, padding: '0.25rem'}} className="rounded-sm mb-1 bg-primary/10">
              <p className="font-bold text-[11px] text-black">{student.fullName}</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center">
              <span className="font-semibold text-gray-700">DOB</span>
              <p className="font-semibold text-gray-900">{student.dateOfBirth && isValid(new Date(student.dateOfBirth)) ? format(new Date(student.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}</p>
              <span className="font-semibold text-gray-700">Blood Group</span>
              <p className="font-semibold text-gray-900">{student.bloodGroup || 'N/A'}</p>
              <span className="font-semibold text-gray-700">Course</span>
              <p className="font-semibold text-gray-900">{student.courseName}</p>
              <span className="font-semibold text-gray-700">Year</span>
              <p className="font-semibold text-gray-900">{student.yearOfJoining}</p>
              <span className="font-semibold text-gray-700">Roll No</span>
              <p className="font-semibold text-gray-900">{student.rollNumber}</p>
              <div style={{...importantInfoStyle, padding: '0.125rem'}} className="rounded-sm col-span-2 mt-0.5 bg-primary/10">
                <span className="font-semibold text-gray-700">PRN No</span>
                <p className="font-bold text-gray-900 inline ml-1">{student.prnNumber}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between items-end text-[10px]">
          <p className="font-bold text-gray-700">{settings.deanTitle.toUpperCase()}</p>
          <div className="text-center">
            <div className="w-20 h-6 border-b border-gray-400 mb-0.5 flex items-center justify-center italic text-gray-500">
              {/* Signature placeholder */}
            </div>
            <p className="font-bold text-gray-700">{settings.defaultCardHolderSignatureText}</p>
          </div>
        </div>
      </Card>
    );
  } else {
    // Back Side
    return (
      <Card className={cardBaseClasses} style={cardDynamicStyle}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        <CardContent className="p-2 space-y-1 text-[9px] leading-snug">
          <div className="flex justify-between items-start mb-1">
            <div className="space-y-0.5">
              <div style={importantInfoStyle} className="bg-muted/40 p-0.5 rounded-sm inline-block">
                <p className="font-semibold"><span className="font-bold">Year of Admission:</span> {yearOfAdmissionDisplay}</p>
              </div>
              <div style={importantInfoStyle} className="bg-muted/40 p-0.5 rounded-sm inline-block mt-1">
                <p className="font-semibold"><span className="font-bold">Valid Upto:</span> {validUptoString}</p>
              </div>
            </div>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="QR Code for Profile" width={50} height={50} data-ai-hint="qr code profile" unoptimized className="border border-gray-300" />
            ) : (
              <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center border border-gray-300">
                <QrCodeIcon size={30} className="text-gray-500" />
              </div>
            )}
          </div>

          <div>
            <p style={importantInfoStyle} className="font-bold bg-muted/40 p-0.5 rounded-sm inline-block">Residential Address:</p>
            <p className="font-semibold whitespace-pre-line text-[8.5px] leading-tight mt-0.5">{student.address || 'N/A'}</p>
          </div>

          {(student.emergencyContactName || student.emergencyContactPhone) && (
            <div className="mt-1">
              <p style={importantInfoStyle} className="font-bold bg-muted/40 p-0.5 rounded-sm inline-block">Emergency Contact:</p>
              <p className="font-semibold text-[8.5px] leading-tight mt-0.5">
                {student.emergencyContactName || ''} {student.emergencyContactName && student.emergencyContactPhone ? ' - ' : ''} {student.emergencyContactPhone || ''}
              </p>
            </div>
          )}

          <ol className="list-decimal list-inside space-y-0.5 mt-1 text-[8px] leading-tight">
            {[settings.instructionLine1, settings.instructionLine2, settings.instructionLine3, settings.instructionLine4].map((inst, idx) => (
              inst && <li key={idx} className="font-semibold">{inst}</li>
            ))}
          </ol>

          <div className="border-t border-gray-300 mt-auto pt-1 flex justify-between items-center text-[9px] absolute bottom-1 left-2 right-2">
            <p className="font-bold"><span className="font-semibold">Mob:</span> {student.mobileNumber || 'N/A'}</p>
            <p className="font-bold"><span className="font-semibold">Office:</span> {settings.officePhoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
