
'use client';

import type { EmployeeData, CardSettingsData } from '@/lib/types';
import FacultyIdCard from './FacultyIdCard';
import StaffIdCard from './StaffIdCard';

interface EmployeeIdCardProps {
  employee: EmployeeData;
  settings?: CardSettingsData;
  showFlipButton?: boolean;
  initialSide?: 'front' | 'back';
  className?: string;
}

export default function EmployeeIdCard({
  employee,
  settings,
  showFlipButton = true,
  initialSide = 'front',
  className,
}: EmployeeIdCardProps) {

  if (employee.employeeType === 'FACULTY') {
    return (
      <FacultyIdCard 
        employee={employee}
        settings={settings}
        showFlipButton={showFlipButton}
        initialSide={initialSide}
        className={className}
      />
    );
  }

  if (employee.employeeType === 'STAFF') {
    return (
      <StaffIdCard 
        employee={employee}
        settings={settings}
        showFlipButton={showFlipButton}
        initialSide={initialSide}
        className={className}
      />
    );
  }

  // Fallback or default case if employeeType is not set
  return <FacultyIdCard employee={employee} settings={settings} showFlipButton={showFlipButton} initialSide={initialSide} className={className}/>;
}
