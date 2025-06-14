'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentIdCard from '@/components/StudentIdCard';
import type { StudentData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { getStudentById, recordCardPrint } from '@/services/studentService';
import { getCardSettings } from '@/services/cardSettingsService';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, AlertTriangle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function PrintPreviewContent() {
  const searchParams = useSearchParams();
  const studentIdsParam = searchParams.get('studentIds');
  const { toast } = useToast();
  const [studentsToPrint, setStudentsToPrint] = useState<StudentData[]>([]);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    if (authIsLoading) return;

    if (!isAuthenticated) {
      setError('Authentication required to view print preview.');
      setIsLoadingData(false);
      return;
    }

    async function loadInitialData() {
      setIsLoadingData(true);
      setError(null);
      let fetchedStudents: StudentData[] = [];
      const errorsAcc: string[] = [];

      try {
        const settings = await getCardSettings();
        setCardSettings(settings);

        if (!studentIdsParam) {
          errorsAcc.push('No student IDs provided for printing.');
        } else {
          const ids = studentIdsParam.split(',').map(id => id.trim().split('?')[0]);
          const printRecordingPromises: Promise<void>[] = [];

          for (const id of ids) {
            try {
              const student = await getStudentById(id.trim());
              if (student) {
                fetchedStudents.push(student);
                printRecordingPromises.push(recordCardPrint(student.prnNumber));
              } else {
                errorsAcc.push(`Student with PRN ${id} not found.`);
              }
            } catch (err) {
              console.error(`Failed to fetch student ${id}:`, err);
              errorsAcc.push(`Failed to load data for student PRN ${id}.`);
            }
          }
          await Promise.all(printRecordingPromises);
        }
      } catch (settingsError) {
        toast({
          title: 'Error Loading Settings',
          description: 'Failed to fetch card settings. Using defaults.',
          variant: 'destructive',
        });
        setCardSettings(DEFAULT_CARD_SETTINGS);
      } finally {
        if (errorsAcc.length > 0) {
          setError(errorsAcc.join(' '));
        }
        setStudentsToPrint(fetchedStudents);
        setIsLoadingData(false);
      }
    }

    loadInitialData();
  }, [studentIdsParam, isAuthenticated, authIsLoading, toast]);

  const handlePrint = () => {
    console.log('Print button clicked');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (authIsLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {authIsLoading ? 'Verifying authentication...' : isLoadingData ? 'Loading cards and settings...' : 'Preparing preview...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Cards</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">
          Go Back
        </Button>
      </div>
    );
  }

  if (studentsToPrint.length === 0 && !isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">No Cards to Print</h2>
        <p className="text-muted-foreground">No student data found for the provided IDs, or no IDs were specified.</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="print-preview-container m-0 p-0">
      <div className="flex flex-col items-center my-4 gap-2 print:hidden">
        <Button onClick={handlePrint} size="lg" className="bg-accent hover:bg-accent/80">
          <Printer className="mr-2 h-5 w-5" /> Print All Cards ({studentsToPrint.length})
        </Button>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          For accurate CR80 size (85.6mm x 53.98mm), set print margins to &quot;None&quot; and scale to &quot;100%&quot; in the print dialog. Ensure &quot;Print Background Graphics&quot; is enabled.
        </p>
      </div>

      <div className="print:block m-0 p-0">
        {studentsToPrint.flatMap((student, studentIdx) => {
          const frontIndex = studentIdx * 2;
          const backIndex = frontIndex + 1;
          const totalSides = studentsToPrint.length * 2;

          return [
            <div
              key={`${student.prnNumber}-front`}
              className={`print:id-card avoid-break-inside ${
                frontIndex < totalSides - 1 ? 'print:break-after-page' : ''
              }`}
            >
              <StudentIdCard
                student={student}
                settings={cardSettings}
                showFlipButton={false}
                initialSide="front"
                className="student-id-card"
              />
            </div>,
            <div
              key={`${student.prnNumber}-back`}
              className={`print:id-card avoid-break-inside ${
                backIndex < totalSides - 1 ? 'print:break-after-page' : ''
              }`}
            >
              <StudentIdCard
                student={student}
                settings={cardSettings}
                showFlipButton={false}
                initialSide="back"
                className="student-id-card"
              />
            </div>,
          ];
        })}
      </div>
    </div>
  );
}

function PrintPreviewPageWrapper() {
  const { isLoading: authIsLoadingFromContext } = useAuth();

  if (authIsLoadingFromContext) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading preview...</p>
          </div>
        }
      >
        <PrintPreviewContent />
      </Suspense>
    </ProtectedRoute>
  );
}

export default PrintPreviewPageWrapper;