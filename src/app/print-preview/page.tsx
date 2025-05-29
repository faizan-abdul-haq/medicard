
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentIdCard from '@/components/StudentIdCard';
import type { StudentData, PrintPreviewParams } from '@/lib/types';
import { getStudentById } from '@/services/studentService';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, AlertTriangle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function PrintPreviewContent() {
  const searchParams = useSearchParams();
  const studentIdsParam = searchParams.get('studentIds');
  
  const [studentsToPrint, setStudentsToPrint] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentsForPrint() {
      if (!studentIdsParam) {
        setError("No student IDs provided for printing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const ids = studentIdsParam.split(',');
      const fetchedStudents: StudentData[] = [];
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const student = await getStudentById(id.trim()); // Use PRN as ID
          if (student) {
            fetchedStudents.push(student);
          } else {
            errors.push(`Student with PRN ${id} not found.`);
          }
        } catch (err) {
          console.error(`Failed to fetch student ${id}:`, err);
          errors.push(`Failed to load data for student PRN ${id}.`);
        }
      }
      
      if (errors.length > 0) {
        setError(errors.join(' '));
      }
      setStudentsToPrint(fetchedStudents);
      setIsLoading(false);
    }

    fetchStudentsForPrint();
  }, [studentIdsParam]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading student cards for printing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Cards</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">Go Back</Button>
      </div>
    );
  }

  if (studentsToPrint.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">No Cards to Print</h2>
        <p className="text-muted-foreground">No student data found for the provided IDs, or no IDs were specified.</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="print-preview-container p-4 print:p-0">
      <div className="print:hidden flex justify-center my-4">
        <Button onClick={handlePrint} size="lg" className="bg-accent hover:bg-accent/80">
          <Printer className="mr-2 h-5 w-5" /> Print All Cards ({studentsToPrint.length})
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 print:block">
        {studentsToPrint.map(student => (
          <div key={student.id} className="card-pair-container p-2 bg-gray-100 print:bg-transparent print:p-0 print:m-0 print:break-after-page">
            <h3 className="text-center font-semibold text-sm mb-2 print:hidden">{student.fullName} - {student.prnNumber}</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center print:flex-row print:justify-around print:items-start">
              <div className="transform scale-95 print:scale-100">
                 <StudentIdCard student={student} showFlipButton={false} initialSide="front"/>
              </div>
              <div className="transform scale-95 print:scale-100">
                 <StudentIdCard student={student} showFlipButton={false} initialSide="back"/>
              </div>
            </div>
            <hr className="my-4 print:hidden"/>
          </div>
        ))}
      </div>
    </div>
  );
}

// Suspense Boundary for useSearchParams
function PrintPreviewPageWrapper() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading authentication...</p></div>;
  }

  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <p>Loading preview...</p></div>}>
        <PrintPreviewContent />
      </Suspense>
    </ProtectedRoute>
  );
}
export default PrintPreviewPageWrapper;

