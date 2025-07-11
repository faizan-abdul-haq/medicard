
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
  className?: string;
}

export default function StudentIdCard({
  student,
  settings: propSettings,
  showFlipButton = true,
  initialSide = 'front',
  className,
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

  const cardBaseClasses = `w-[85.6mm] h-[53.98mm] mx-auto shadow-xl rounded-lg overflow-hidden bg-white border border-gray-300 relative print:shadow-none print:border-gray-400 ${className || ''}`;
  
  const headerBackgroundColorStyle: React.CSSProperties = {
    backgroundColor: settings.headerBackgroundColor,
    color: settings.headerTextColor,
  };

  const collegeNameLine1Style: React.CSSProperties = {
    fontSize: `${settings.collegeNameLine1FontSize}px`,
    fontWeight: 'bolder',
  };

  const collegeNameLine2Style: React.CSSProperties = {
    fontSize: `${settings.collegeNameLine2FontSize}px`,
    fontWeight: 'bolder',
  };
  
  const personNameStyle: React.CSSProperties = {
    fontSize: `${settings.personNameFontSize}px`,
  };

  const detailsStyle: React.CSSProperties = {
    fontSize: `${settings.detailsFontSize}px`,
  };
  
  const importantInfoStyle: React.CSSProperties = {
    backgroundColor: settings.importantInfoBackgroundColor,
  };

  const cardDynamicStyle: React.CSSProperties = {
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
        <div style={headerBackgroundColorStyle} className="pt-1.5 pr-1.5 pl-1.5 flex items-center print:pt-2">
          <div className="w-1/5 flex justify-center items-center print:pl-2">
            <Image 
              src={finalLogoUrl} 
              alt="College Logo" 
              width={50} 
              height={40} 
              data-ai-hint="college logo" 
              onError={() => setLogoError(true)}
              unoptimized
            />
          </div>
          <div className="w-4/5 text-center leading-tight print:pr-2">
            <p style={collegeNameLine1Style} className="tracking-tighter">{settings.collegeNameLine1}</p>
            <p style={collegeNameLine2Style} className="tracking-tighter">{settings.collegeNameLine2}</p>
          </div>
        </div>

        <CardContent className="p-1.5 flex flex-row gap-4 print:pl-2">
          <div className="h-[28mm] w-[23mm] flex-shrink-0 mt-1">
            <div className="w-full h-full relative">
              <Image
                  src={
                    student.photographUrl ||
                    "https://placehold.co/80x80.png"
                  }
                alt={student.fullName}
                  fill
                  className="object-cover border-2 border-[#004AAD] rounded"
                data-ai-hint="student portrait"
                unoptimized
              />
            </div>
          </div>
          <div className="flex-grow space-y-0.5" style={detailsStyle}>
            <div style={{...importantInfoStyle}} className="rounded-sm mb-1 bg-primary/10">
              <p style={personNameStyle} className="uppercase font-bold text-[#004AAD]">{student.fullName}</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center text-[1em]">
              <span className="font-bold text-black">Course</span>
              <p className="font-bold text-black">{student.courseName}</p>
              <span className="font-bold text-black">Year</span>
              <p className="font-bold text-black">{student.yearOfJoining}</p>
              <span className="font-bold text-black">Roll No</span>
              <p className="font-bold text-black">{student.rollNumber}</p>

            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between items-end text-[11px]">
          <div className="flex flex-col items-start print:pl-2">
            {settings.deanSignatureUrl && (
              <Image
                src={settings.deanSignatureUrl}
                alt="Dean's Signature"
                width={60}
                height={40}
                className="object-contain h-auto max-h-[24px]"
                unoptimized
              />
            )}
            <p className="font-bold text-[#004AAD] mt-0.5">{settings.deanTitle.toUpperCase()}</p>
          </div>          
          <div className="text-right print:pr-2">
            <div className="w-30 h-6 text-black mb-0.5 flex justify-end">
            
            {student.cardHolderSignature && (
              <Image
                src={student.cardHolderSignature}
                alt=""
                width={70}
                height={40}
                className="object-contain h-auto max-h-[24px]"
                unoptimized
              />
            )}
            </div>
            <p className="font-bold text-[#004AAD]">{settings.defaultCardHolderSignatureText}</p>
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
        <CardContent className="p-2 space-y-1 leading-snug" style={detailsStyle}>
        <div className="flex justify-between items-start mb-1 print:pt-2">
          {/* Left: Text info stacked top and bottom */}
          <div className="flex flex-col justify-between h-[50px] print:pl-2 print:pt-2"> {/* Adjust height as needed */}
                      
            <div
              style={importantInfoStyle}
              className="text-black p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-bold">
                <span className="font-bold">PRN No:</span> {student.prnNumber}
              </p>
            </div> 

            <div
              style={importantInfoStyle}
              className="text-black p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-bold">
                <span className="font-bold">DOB:</span> {student.dateOfBirth && isValid(new Date(student.dateOfBirth)) ? format(new Date(student.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div> 

            <div
              style={importantInfoStyle}
              className="text-black p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-bold">
                <span className="font-bold">Year of Admission:</span> {yearOfAdmissionDisplay}
              </p>
            </div>

            <div
              style={importantInfoStyle}
              className="text-start text-black p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-bold">
                <span className="font-bold">Valid Upto:</span> {validUptoString}
              </p>
            </div>

            <div
              style={importantInfoStyle}
              className="text-start text-black p-0.5 rounded-sm inline-block uppercase"
            >
              <p className="font-bold">
                <span className="font-bold">Blood group:</span> {student.bloodGroup || 'N/A'}
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
              className="border border-gray-300 print:pr-2"
            />
          ) : (
            <div className="w-[50px] h-[50px] text-black flex items-center justify-center border border-gray-300 print:pr-2 print:pt-3">
              <QrCodeIcon size={30} className="text-black" />
            </div>
          )}
        </div>


          <div className='print:pl-2 print:pr-2'>
            <p style={importantInfoStyle} className="font-bold text-black p-0.5 rounded-sm inline-block">Residential Address:</p>
            <p className="text-black font-bold text-[0.9em] leading-tight mt-0.5">{student.address || 'N/A'}</p>
          </div>

          <ol className="text-black list-decimal list-inside space-y-0.5 mt-1 text-[0.9em] leading-tight print:pl-2 print:pr-2">
            {[settings.instructionLine1, settings.instructionLine2, settings.instructionLine3, settings.instructionLine4].map((inst, idx) => (
              inst && <li key={idx} className="font-bold text-black">{inst}</li>
            ))}
          </ol>

          <div className="border-t text-black mt-auto pt-1 flex justify-between items-center text-[0.9em] absolute bottom-2 left-2 right-2">
            <p className="font-bold text-black"><span className="font-bold">Mob:</span> {student.mobileNumber || 'N/A'}</p>
            <p className="font-bold text-black"><span className="font-bold">Office:</span> {settings.officePhoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
