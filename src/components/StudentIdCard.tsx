
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
  const [logoError, setLogoError] = useState(false);

  const settings = { ...DEFAULT_CARD_SETTINGS, ...propSettings };

  const registrationYear = student.registrationDate ? new Date(student.registrationDate).getFullYear() : new Date().getFullYear();
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
        setIsFrontVisible(initialSide === 'front');
    }
  }, [initialSide, showFlipButton]);
  
  useEffect(() => {
    setLogoError(false); // Reset logo error state when settings or logo URL changes
  }, [settings.logoUrl]);

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

  const finalLogoUrl = logoError || !settings.logoUrl ? 'https://placehold.co/30x30.png' : settings.logoUrl;

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
              src={finalLogoUrl} 
              alt="College Logo" 
              width={30} 
              height={30} 
              data-ai-hint="college logo" 
              onError={() => setLogoError(true)}
              unoptimized
            />
          </div>
          <div className="w-4/5 text-center leading-tight">
            <p className="font-bold text-[12px] tracking-tighter">{settings.collegeNameLine1}</p>
            <p className="font-bold text-[11px] tracking-tighter">{settings.collegeNameLine2}</p>
          </div>
        </div>

        <CardContent className="p-2 flex flex-row gap-2">
          <div className="w-[80px] flex-shrink-0 mt-1">
            <Image
              src={student.photographUrl || "https://placehold.co/80x80.png"}
              alt={student.fullName}
              width={80}
              height={80}
              className=" h-[80px] object-cover border border-gray-400"
              data-ai-hint="student portrait"
              unoptimized
            />
          </div>
          <div className="flex-grow space-y-0.5 text-[12px]">
            <div style={{...importantInfoStyle, padding: '0.25rem'}} className="rounded-sm mb-1 bg-primary/10">
              <p className="uppercase font-bold text-[12px] text-black">{student.fullName}</p>
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
              <div style={{...importantInfoStyle, padding: '0.125rem'}} className="text-start rounded-sm col-span-2 mt-0.5 bg-primary/10">
                <span className="font-semibold text-gray-700">PRN No</span>
                <p className="font-bold text-gray-900 inline ml-1">{student.prnNumber}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between items-end text-[11px]">
          
          <div className="flex flex-col items-start">
            {settings.deanSignatureUrl && (
              <Image
                src={settings.deanSignatureUrl}
                alt="Dean's Signature"
                width={50}
                height={30}
                className="object-contain"
                style={{ height: 'inherit', color: 'transparent' }}
                unoptimized
              />
            )}
            <p className="font-bold text-gray-900 mt-0.5">{settings.deanTitle.toUpperCase()}</p>
          </div>          
          <div className="text-right">
            <div className="w-30 h-6 border-b text-gray-900 mb-0.5 flex justify-end">
            
            {student.cardHolderSignature && (
              <Image
                src={student.cardHolderSignature}
                alt=""
                width={50}
                height={30}
                className="object-contain"
                style={{ height: 'inherit', color: 'transparent' }}
                unoptimized
              />
            )}
            </div>
            <p className="font-bold text-gray-900">{settings.defaultCardHolderSignatureText}</p>
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
        <CardContent className="p-2 space-y-1 text-[10px] leading-snug">
        <div className="flex justify-between items-start mb-1">
          {/* Left: Text info stacked top and bottom */}
          <div className="flex flex-col justify-between h-[50px]"> {/* Adjust height as needed */}
            <div
              style={importantInfoStyle}
              className="text-gray-900 p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-semibold">
                <span className="font-bold">Year of Admission:</span> {yearOfAdmissionDisplay}
              </p>
            </div>
            <div
              style={importantInfoStyle}
              className="text-start text-gray-900 p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-semibold">
                <span className="font-bold">Valid Upto:</span> {validUptoString}
              </p>
            </div>
          </div>

          {/* Right: QR Code or placeholder */}
          {qrCodeUrl ? (
            <Image
              src={qrCodeUrl}
              alt="QR Code for Profile"
              width={50}
              height={50}
              data-ai-hint="qr code profile"
              unoptimized
              className="border border-gray-300"
            />
          ) : (
            <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center border border-gray-300">
              <QrCodeIcon size={30} className="text-gray-500" />
            </div>
          )}
        </div>


          <div>
            <p style={importantInfoStyle} className="font-bold text-gray-900 p-0.5 rounded-sm inline-block">Residential Address:</p>
            <p className="font-semibold whitespace-pre-line text-[8.5px] leading-tight mt-0.5">{student.address || 'N/A'}</p>
          </div>

          <ol className="list-decimal list-inside space-y-0.5 mt-1 text-[10px] leading-tight">
            {[settings.instructionLine1, settings.instructionLine2, settings.instructionLine3, settings.instructionLine4].map((inst, idx) => (
              inst && <li key={idx} className="font-semibold">{inst}</li>
            ))}
          </ol>

          <div className="border-t text-gray-900 mt-auto pt-1 flex justify-between items-center text-[10px] absolute bottom-1 left-2 right-2">
            <p className="font-bold"><span className="font-semibold">Mob:</span> {student.mobileNumber || 'N/A'}</p>
            <p className="font-bold"><span className="font-semibold">Office:</span> {settings.officePhoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
