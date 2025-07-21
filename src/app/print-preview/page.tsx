
'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentIdCard from '@/components/StudentIdCard';
import EmployeeIdCard from '@/components/EmployeeIdCard';
import type { StudentData, EmployeeData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { getStudentById, recordCardPrint } from '@/services/studentService';
import { getEmployeeById, recordEmployeeCardPrint } from '@/services/employeeService';
import { getCardSettings } from '@/services/cardSettingsService';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, AlertTriangle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PrintableItem = 
  | { type: 'student', data: StudentData, settings: CardSettingsData }
  | { type: 'employee', data: EmployeeData, settings: CardSettingsData };

function PrintPreviewContent() {
  const searchParams = useSearchParams();
  const studentIdsParam = searchParams.get('studentIds');
  const employeeIdsParam = searchParams.get('employeeIds');

  const { toast } = useToast();

  const [itemsToPrint, setItemsToPrint] = useState<PrintableItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authIsLoading, currentUser } = useAuth();
  const hasRecordedPrint = useRef(false);

  useEffect(() => {
    if (hasRecordedPrint.current) return;
    
    if (authIsLoading) return;

    if (!isAuthenticated) {
      setError("Authentication required to view print preview.");
      setIsLoadingData(false);
      return;
    }
    
    async function loadInitialData() {
      setIsLoadingData(true);
      setError(null);
      
      const studentIds = studentIdsParam ? studentIdsParam.split(',').map(id => id.trim()) : [];
      const employeeIds = employeeIdsParam ? employeeIdsParam.split(',').map(id => id.trim()) : [];
      
      if (studentIds.length === 0 && employeeIds.length === 0) {
        setIsLoadingData(false);
        return;
      }
      
      hasRecordedPrint.current = true; // Set ref immediately to prevent re-runs
      const printedBy = currentUser?.email || 'Unknown';
      
      const fetchedItems: PrintableItem[] = [];
      const errorsAcc: string[] = [];

      try {
        if (studentIds.length > 0) {
          const studentSettings = await getCardSettings('student');
          const printRecordingPromises: Promise<void>[] = [];

          for (const id of studentIds) {
            try {
              const student = await getStudentById(id.trim());
              if (student) {
                fetchedItems.push({ type: 'student', data: student, settings: studentSettings });
                printRecordingPromises.push(recordCardPrint(student.prnNumber, printedBy));
              } else {
                errorsAcc.push(`Student with PRN ${id} not found.`);
              }
            } catch (err) {
              errorsAcc.push(`Failed to load data for student PRN ${id}.`);
            }
          }
          await Promise.all(printRecordingPromises);
        }
        
        if (employeeIds.length > 0) {
           const facultySettings = await getCardSettings('faculty');
           const staffSettings = await getCardSettings('staff');
           const printRecordingPromises: Promise<void>[] = [];

           for (const id of employeeIds) {
              try {
                const employee = await getEmployeeById(id);
                if (employee) {
                  const settings = employee.employeeType === 'FACULTY' ? facultySettings : staffSettings;
                  fetchedItems.push({ type: 'employee', data: employee, settings });
                  printRecordingPromises.push(recordEmployeeCardPrint(employee.id, printedBy));
                } else {
                  errorsAcc.push(`Employee with ID ${id} not found.`);
                }
              } catch(err) {
                 errorsAcc.push(`Failed to load data for employee ID ${id}.`);
              }
           }
           await Promise.all(printRecordingPromises);
        }

      } catch (settingsError) {
        toast({ title: "Error Loading Settings", description: "Failed to fetch card settings. Using defaults.", variant: "destructive" });
      } finally {
        if (errorsAcc.length > 0) {
          setError(errorsAcc.join(' '));
        }
        setItemsToPrint(fetchedItems);
        setIsLoadingData(false);
      }
    }

    loadInitialData();

  }, [studentIdsParam, employeeIdsParam, isAuthenticated, authIsLoading, toast, currentUser]);

  const handlePrint = () => {
    setTimeout(() => { window.print(); }, 200);
  };

  if (authIsLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {authIsLoading ? "Verifying authentication..." : "Loading cards..."}
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
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">Go Back</Button>
      </div>
    );
  }

  if (itemsToPrint.length === 0 && !isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 print:hidden text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">No Cards to Print</h2>
        <p className="text-muted-foreground">No valid student or employee data found for the provided IDs.</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-6">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="print-preview-container print:m-0 print:p-0">
      <p className="text-center text-sm text-muted-foreground mt-2 print:hidden">
        For accurate CR80 size (85.6mm x 53.98mm), set print margins to "None" and scale to "100%" in the print dialog.
      </p>
      <div className="print:hidden flex justify-center my-4">
        <Button onClick={handlePrint} size="lg" className="bg-accent hover:bg-accent/80">
          <Printer className="mr-2 h-5 w-5" /> Print All Cards ({itemsToPrint.length})
        </Button>
      </div>

      <div className="print:block">
        {itemsToPrint.flatMap((item, itemIdx) => {
          const frontIndex = itemIdx * 2;
          const backIndex = frontIndex + 1;
          const totalSides = itemsToPrint.length * 2;
          
          const commonFrontClasses = `print:id-card flex justify-center items-center avoid-break-inside ${frontIndex < totalSides - 1 ? 'print:break-after-page' : ''}`;
          const commonBackClasses = `print:id-card flex justify-center items-center avoid-break-inside ${backIndex < totalSides - 1 ? 'print:break-after-page' : ''}`;

          if (item.type === 'student') {
            return [
              <div key={`${item.data.prnNumber}-front`} className={commonFrontClasses}>
                <StudentIdCard student={item.data} settings={item.settings} showFlipButton={false} initialSide="front" className="student-id-card" />
              </div>,
              <div key={`${item.data.prnNumber}-back`} className={commonBackClasses}>
                <StudentIdCard student={item.data} settings={item.settings} showFlipButton={false} initialSide="back" className="student-id-card" />
              </div>
            ];
          } else { // item.type === 'employee'
             return [
              <div key={`${item.data.id}-front`} className={commonFrontClasses}>
                <EmployeeIdCard employee={item.data} settings={item.settings} showFlipButton={false} initialSide="front" className="employee-id-card" />
              </div>,
              <div key={`${item.data.id}-back`} className={commonBackClasses}>
                <EmployeeIdCard employee={item.data} settings={item.settings} showFlipButton={false} initialSide="back" className="employee-id-card" />
              </div>
            ];
          }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Suspense fallback={
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading preview...</p>
          </div>
        }>
        <PrintPreviewContent />
      </Suspense>
    </ProtectedRoute>
  );
}

export default PrintPreviewPageWrapper;
