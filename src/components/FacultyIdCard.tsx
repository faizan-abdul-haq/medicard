
'use client';

import type { EmployeeData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Repeat, QrCodeIcon, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Separator } from './ui/separator';

interface FacultyIdCardProps {
  employee: EmployeeData;
  settings?: CardSettingsData;
  showFlipButton?: boolean;
  initialSide?: 'front' | 'back';
  className?: string;
}

export default function FacultyIdCard({
  employee,
  settings: propSettings,
  showFlipButton = true,
  initialSide = 'front',
  className,
}: FacultyIdCardProps) {
  const [isFrontVisible, setIsFrontVisible] = useState(initialSide === 'front');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [logoError, setLogoError] = useState(false);

  const settings = { ...DEFAULT_CARD_SETTINGS, ...propSettings };

  useEffect(() => {
    if (typeof window !== 'undefined' && employee.employeeId) {
      const profileUrl = `${window.location.origin}/employees/${employee.id}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(profileUrl)}&margin=0`);
    }
  }, [employee.id, employee.employeeId]);

  useEffect(() => {
    setIsFrontVisible(initialSide === 'front');
  }, [initialSide]);

  useEffect(() => {
    setLogoError(false);
  }, [settings.logoUrl]);

  const toggleCardSide = () => {
    if (showFlipButton) {
      setIsFrontVisible(!isFrontVisible);
    }
  };

  const cardBaseClasses = `w-[85.6mm] h-[53.98mm] mx-auto shadow-xl rounded-lg overflow-hidden bg-white border border-gray-300 relative print:shadow-none print:border-gray-400`;
  
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

  const employeeTypeStyles = 'bg-purple-600 text-white';

  if (isFrontVisible) {
    return (
      <Card className={cardBaseClasses} style={cardDynamicStyle}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        {employee.isOrganDonor && (
          <div className="absolute top-0 right-0 h-full w-[12px] bg-red-600 flex items-center justify-center z-20">
            <p className="text-white font-bold text-[9px] transform -rotate-90 origin-center whitespace-nowrap">I am an Organ Donor</p>
          </div>
        )}
        <div style={headerBackgroundColorStyle} className="pt-1.5 pr-1.5 pl-1.5 flex items-center print:pt-2">
          <div className="w-1/5 flex justify-center items-center print:pl-2">
            <Image 
              src={finalLogoUrl} 
              alt="Company Logo" 
              width={50} 
              height={40} 
              data-ai-hint="company logo" 
              onError={() => setLogoError(true)}
              unoptimized
            />
          </div>
          <div className="w-4/5 text-center leading-tight print:pr-2">
            <p style={collegeNameLine1Style} className="tracking-tighter">{settings.collegeNameLine1}</p>
            <p style={collegeNameLine2Style} className="tracking-tighter">{settings.collegeNameLine2}


            </p>
              <div className="border-t-2 w-[90%] my-1 print:pb-1 print:pt-1 self-start" style={{ borderColor: '#000' }}></div>

          </div>
        </div>

        <CardContent className="p-1.5 flex flex-row gap-4 print:pl-2 print:pt-2">
          <div className="h-[20mm] w-[15mm] flex-shrink-0 mt-1">
            <div className="w-full h-full relative">
              <Image
                src={employee.photographUrl || "https://placehold.co/80x80.png"}
                alt={employee.fullName}
                fill
                className="object-cover border-2 border-primary rounded"
                data-ai-hint="employee portrait"
                unoptimized
              />
            </div>
          </div>
          <div className="flex-grow space-y-0.5" style={detailsStyle}>
            <div style={importantInfoStyle} className="rounded-sm mb-1 bg-primary/10 flex justify-between items-center">
              <p style={personNameStyle} className="uppercase font-bold text-primary">{employee.fullName}</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center text-[1em]">
              <span className="text-black">{'Designation :'}</span>
              <p className="text-black">{employee.designation}</p>
              <span className="text-black">{'Blood Grp :'}</span>
              <p className="text-black">{employee.bloodGroup || 'N/A'}</p>
              <span className="text-black">{'Birth Date : '}</span>
              <p className="text-black">{employee.dateOfBirth && isValid(new Date(employee.dateOfBirth)) ? format(new Date(employee.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-1 left-0 right-1 px-3 flex justify-between items-end text-[11px]">
          <div className="flex flex-col items-start print:pl-2">
            {settings.deanSignatureUrl && (
              <Image src={settings.deanSignatureUrl} alt="Authority Signature" width={60} height={40} className="object-contain h-auto max-h-[24px]" unoptimized />
            )}
            <p className="font-bold text-primary mt-0.5">{settings.deanTitle.toUpperCase()}</p>
          </div>          
          <div className="text-right print:pr-2">
            <div className="w-30 h-6 text-black mb-0.5 flex justify-end">
              {employee.cardHolderSignature && (
                <Image src={employee.cardHolderSignature} alt="" width={70} height={40} className="object-contain h-auto max-h-[24px]" unoptimized />
              )}
            </div>
            <p className="font-bold text-primary">{settings.defaultCardHolderSignatureText}</p>
          </div>
        </div>
      </Card>
    );
  } else {
    // Back Side
    const instructions = [
      settings.instructionLine1, settings.instructionLine2, settings.instructionLine3, settings.instructionLine4
    ];

    return (
      <Card className={cardBaseClasses} style={cardDynamicStyle}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        <CardContent className="p-2 print:pt-2 space-y-1 leading-[1]" style={detailsStyle}>
          <div className='print:pl-2 print:pr-2 flex justify-between items-start mb-1'>
            <div className="space-y-0.5">
                <p style={importantInfoStyle} className="font-bold text-black rounded-sm inline-block ">{'ID NO:'} {employee.employeeId || 'N/A'}</p>
                <p style={importantInfoStyle} className="font-bold text-black rounded-sm block">{'SEVARTH NO:'} {employee.sevarthNo || 'N/A'}</p>
                <p style={importantInfoStyle} className="font-bold text-black rounded-sm block">{'MOBILE NO:'} {employee.mobileNumber || 'N/A'}</p>
            </div>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="QR Code" width={50} height={50} data-ai-hint="qr code" unoptimized className="border border-gray-300" />
            ) : (
              <div className="w-[50px] h-[50px] flex items-center justify-center border border-gray-300">
                <QrCodeIcon size={30} />
              </div>
            )}
          </div>
          
          <div className='print:pl-2 print:pr-2'>
            <p style={importantInfoStyle} className="font-bold text-black rounded-sm inline-block">{'Residential Address:'}</p>
            <p className="font-bold text-black leading-tight mt-0.5 max-w-[180px]">{employee.address || 'N/A'}</p>
            <Separator className="my-1 bg-gray-400 print:pt-2 print:pb-2" />
          </div>
          <ul className="list-decimal list-inside space-y-0.5 mt-1 leading-tight print:pl-2 print:pr-2 print:pt-2">
            {instructions.map((inst, idx) => (
              inst && <li key={idx} className="font-bold text-black">{inst}</li>
            ))}
          </ul>
          <div className="text-black mt-auto pt-1 flex justify-end items-center absolute bottom-2 left-2 right-2">
            <p className="font-bold text-black">{'Office'}: {settings.officePhoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
