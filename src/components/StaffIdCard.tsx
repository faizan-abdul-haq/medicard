
'use client';

import type { EmployeeData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Repeat, QrCodeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Separator } from './ui/separator';

interface StaffIdCardProps {
  employee: EmployeeData;
  settings?: CardSettingsData;
  showFlipButton?: boolean;
  initialSide?: 'front' | 'back';
  className?: string;
}

export default function StaffIdCard({
  employee,
  settings: propSettings,
  showFlipButton = true,
  initialSide = 'front',
  className,
}: StaffIdCardProps) {
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
    maxWidth: '250px'
  };
  
  const personNameStyle: React.CSSProperties = {
    fontSize: `${settings.personNameFontSize}px`,
  };

  const frontDetailsStyle: React.CSSProperties = {
    fontSize: `${settings.frontDetailsFontSize}px`,
  };

  const backDetailsStyle: React.CSSProperties = {
    fontSize: `${settings.backDetailsFontSize}px`,
  };

  const addressStyle: React.CSSProperties = {
    fontSize: `${settings.addressFontSize}px`,
  };

  const instructionsStyle: React.CSSProperties = {
    fontSize: `${settings.instructionsFontSize}px`,
  };
  
  const footerStyle: React.CSSProperties = {
    fontSize: `${settings.footerFontSize}px`,
  };

  const importantInfoStyle: React.CSSProperties = {
    backgroundColor: settings.importantInfoBackgroundColor,
  };

  const cardDynamicStyle: React.CSSProperties = {
    fontFamily: settings.cardFontFamily,
  };

  const finalLogoUrl = logoError || !settings.logoUrl ? 'https://placehold.co/30x30.png' : settings.logoUrl;


  if (isFrontVisible) {
    const collegeNameParts = settings.collegeNameLine1.split(' ');
    const firstPart = collegeNameParts[0] || '';
    const secondPart = collegeNameParts.slice(1).join(' ');

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

        <div style={headerBackgroundColorStyle} className="pt-2 pr-2 pl-2 flex flex-col items-center justify-center text-center leading-tight print:pt-2">
          <div className="flex items-center justify-center gap-1">
            <span style={collegeNameLine1Style} className="tracking-tighter">{firstPart}</span>
            <Image 
              src={finalLogoUrl} 
              alt="Company Logo" 
              width={50} 
              height={50} 
              className="h-auto"
              data-ai-hint="company logo" 
              onError={() => setLogoError(true)}
              unoptimized
            />
            <span style={collegeNameLine1Style} className="tracking-tighter">{secondPart}</span>
          </div>
          <p style={collegeNameLine2Style} className="tracking-tighter pt-1 print:pt-1">{settings.collegeNameLine2}</p>
        </div>

        <CardContent className="p-2 flex flex-row gap-4 print:pl-2">
          <div className="h-[20mm] w-[17mm] flex-shrink-0 mt-1">
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
          <div className="flex-grow space-y-0.5" style={frontDetailsStyle}>
            <div style={importantInfoStyle} className="rounded-sm mb-1 flex justify-between items-center">
              <p style={personNameStyle} className="uppercase font-bold text-black">{employee.fullName}</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center text-[1em] text-black">
              <span className="font-bold text-black">{'पदनाम'}</span>
              <p className='text-black'>{employee.designation}</p>
              <span className="font-bold text-black">{'रक्त गट'}</span>
              <p className='text-black'>{employee.bloodGroup || 'N/A'}</p>
              <span className="font-bold text-black">{'जन्मतारीख'}</span>
              <p className='text-black'>{employee.dateOfBirth && isValid(new Date(employee.dateOfBirth)) ? format(new Date(employee.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-1 left-0 right-1 px-3 flex justify-between items-end text-[11px]">
          <div className="flex flex-col items-start print:pl-2">
            {settings.deanSignatureUrl && (
              <Image src={settings.deanSignatureUrl} alt="Authority Signature" width={60} height={40} className="object-contain h-auto max-h-[24px]" unoptimized />
            )}
            <p className="font-bold text-black mt-0.5">{'अधिष्ठाता'}</p>
          </div>          
          <div className="text-right print:pr-2">
            <div className="w-30 h-6 text-black mb-0.5 flex justify-end">
              {employee.cardHolderSignature && (
                <Image src={employee.cardHolderSignature} alt="" width={70} height={40} className="object-contain h-auto max-h-[24px]" unoptimized />
              )}
            </div>
            <p className="font-bold text-black">{'कार्ड धारकाची सही'}</p>
          </div>
        </div>
      </Card>
    );
  } else {
    // Back Side
    const instructions = [
      settings.instructionLine1,
      settings.instructionLine2,
      settings.instructionLine3,
      settings.instructionLine4,
      settings.instructionLine5,
    ].filter(Boolean); // Filter out any empty or null instructions

    return (
      <Card className={cardBaseClasses} style={cardDynamicStyle}>
        {showFlipButton && (
          <Button variant="ghost" size="icon" onClick={toggleCardSide} className="absolute top-1 right-1 z-10 h-6 w-6 print:hidden">
            <Repeat size={16} />
          </Button>
        )}
        <CardContent className="p-2 print:pt-2 space-y-1 leading-snug">
          <div className='print:pl-2 print:pr-2 print:pb-4 flex justify-between items-start mb-1' style={backDetailsStyle}>
            <p style={importantInfoStyle} className="font-bold text-black p-0.5 rounded-sm inline-block text-center">{'ओळखपत्र क्रमांक:'}<br/> <span>{employee.employeeId || 'N/A'}</span></p>
            <p style={importantInfoStyle} className="font-bold text-black p-0.5 rounded-sm inline-block text-center">{'सेवार्थ नंबर:'}<br/>{employee.sevarthNo || 'N/A'}</p>
          </div>
          
          <div className="flex justify-end items-start mb-1">
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="QR Code" width={50} height={50} data-ai-hint="qr code" unoptimized className=" print:pr-2 print:pt-6 border border-gray-300" />
            ) : (
              <div className="w-[50px] h-[50px] flex items-center justify-center border border-gray-300">
                <QrCodeIcon size={30} />
              </div>
            )}
          </div>
          
          <div className='print:pl-2 print:pr-2 print:pb-2 print:pt-6'>
            <p style={{...importantInfoStyle,...addressStyle}} className="font-bold text-black p-0.5 rounded-sm inline-block print:pb-2">{'कायमचा रहिवासी पत्ता'}</p>
            <p className="font-bold text-black mt-0.5 max-w-[200px] print:pb-2" style={addressStyle}>{employee.address || 'N/A'}</p>
            <Separator className="my-1 print:pb-2 print:pt-2" />
          </div>
          <div className="print:pl-2 print:pr-2 print:pt-2 mt-1 text-black" style={instructionsStyle}>
            {instructions.map((inst, idx) => (
              inst && (
                <span key={idx} className="text-black">
                  <strong>{idx + 1}.</strong> {inst}
                  {idx < instructions.length - 1 && ' '}
                </span>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
}
