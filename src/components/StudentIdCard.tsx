
'use client';

import type { StudentData } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react'; // Using ShieldCheck as a placeholder logo
import { format } from 'date-fns';

interface StudentIdCardProps {
  student: StudentData;
}

export default function StudentIdCard({ student }: StudentIdCardProps) {
  
  const collegeName = "GOVERNMENT MEDICAL COLLEGE &";
  const hospitalInfo = "GROUP OF HOSPITALS, MUMBAI 400008"; // Example, adjust as needed

  return (
    <Card className="w-[330px] h-[210px] mx-auto shadow-xl rounded-lg overflow-hidden bg-white border border-gray-300 relative font-sans text-xs">
      {/* Blue Header */}
      <div className="bg-blue-700 text-white p-1.5 flex items-center">
        <div className="w-1/5 flex justify-center items-center">
           {/* Placeholder for actual logo */}
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
            src={student.photographUrl || "https://placehold.co/120x150.png"} 
            alt={student.fullName} 
            width={80} 
            height={100} 
            className="object-cover border border-gray-400"
            data-ai-hint="student portrait"
          />
        </div>

        {/* Right Side: Details */}
        <div className="flex-grow space-y-0.5 text-[10px]">
          <p className="font-bold text-[11px] text-black mb-1">{student.fullName}</p>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center">
            <p className="font-semibold text-gray-700">DOB</p>
            <p className="text-gray-900">{student.dateOfBirth ? format(student.dateOfBirth, 'dd/MM/yyyy') : 'N/A'}</p>

            <p className="font-semibold text-gray-700">Blood Group</p>
            <p className="text-gray-900">{student.bloodGroup || 'N/A'}</p>

            <p className="font-semibold text-gray-700">Course</p>
            <p className="text-gray-900">{student.courseName}</p>

            <p className="font-semibold text-gray-700">Year</p>
            <p className="text-gray-900">{student.yearOfJoining}</p>
            
            <p className="font-semibold text-gray-700">Roll No</p>
            <p className="text-gray-900">{student.rollNumber}</p>

            <p className="font-semibold text-gray-700">PRN No</p>
            <p className="text-gray-900">{student.prnNumber}</p>
          </div>
        </div>
      </CardContent>

      {/* Footer Area */}
      <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between items-end text-[10px]">
        <p className="font-semibold text-gray-700">DEAN</p>
        <div className="text-center">
           {/* Placeholder for actual signature image. For now, text or an icon can be used. */}
           <div className="w-20 h-6 border-b border-gray-400 mb-0.5 flex items-center justify-center italic text-gray-500">
            {/* Batu (example signature text) or <SignatureIcon /> */}
           </div>
          <p className="font-semibold text-gray-700">Card Holder's Signature</p>
        </div>
      </div>
    </Card>
  );
}
