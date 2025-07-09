
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck, AlertTriangle, Printer, History, Mail, Phone, Home, CalendarDays, Droplets, Loader2, ArrowLeft, Briefcase, Edit3, Trash2 } from "lucide-react";
import Image from "next/image";
import type { EmployeeData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getEmployeeById, deleteEmployee } from '@/services/employeeService'; 
import { getCardSettings } from '@/services/cardSettingsService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeIdCard from '@/components/EmployeeIdCard';
import EmployeeEditForm from '@/components/EmployeeEditForm';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function EmployeeProfileContent({ employeeId }: { employeeId: string }) {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [employeeData, settingsData] = await Promise.all([ getEmployeeById(employeeId), getCardSettings() ]);
      if (employeeData) setEmployee(employeeData);
      else setError(`Employee with identifier ${employeeId} not found.`);
      setCardSettings(settingsData);
    } catch (err) {
      setError("Failed to load employee data or settings.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && employee) {
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`);
    }
  }, [employee]);

  const handleUpdateSuccess = (updatedEmployee: EmployeeData) => {
    setEmployee(updatedEmployee);
    setIsEditing(false);
    toast({ title: "Profile Updated" });
  };

  const handleDeleteConfirmed = async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id, employee.photographUrl);
      toast({ title: "Employee Deleted" });
      router.push('/employees/list');
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete employee.", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-center text-destructive p-8">{error}</div>;
  if (!employee) return <div className="text-center p-8">Employee not found.</div>;
  if (isEditing) return <EmployeeEditForm employeeToEdit={employee} onUpdateSuccess={handleUpdateSuccess} onCancel={() => setIsEditing(false)} />;

  const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => (
    value ? <div className="flex items-start gap-2 py-1"><span className="text-primary mt-0.5">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div></div> : null
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
       <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit3 className="mr-2 h-4 w-4" /> Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={isDeleting}>{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>Delete {employee.fullName} (ID: {employee.employeeId})? This is permanent.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting}>Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary"><Briefcase size={24} /> Employee Digital Profile</CardTitle>
          <CardDescription>Overview of employee details and ID card status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 text-center">
              <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-primary/30 rounded-lg mx-auto">
                <AvatarImage src={employee.photographUrl || "https://placehold.co/160x160.png"} alt={employee.fullName} data-ai-hint="employee portrait" className="object-cover"/>
                <AvatarFallback className="text-4xl">{employee.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {qrCodeUrl && (
                <div className="mt-3 p-2 bg-muted/30 rounded-md text-center">
                  <QrCode className="mx-auto mb-1 text-primary/70" size={24} />
                  <p className="text-xs font-bold">Profile QR</p>
                  <Image src={qrCodeUrl} alt="QR Code" width={70} height={70} className="rounded-sm border mx-auto mt-1" data-ai-hint="qr code" unoptimized/>
                </div>
              )}
            </div>
            <div className="flex-grow space-y-3 w-full">
              <h2 className="text-2xl font-bold text-primary text-center md:text-left">{employee.fullName}</h2>
              <p className="text-md text-muted-foreground font-semibold text-center md:text-left">{employee.designation} - {employee.department}</p>
              <Separator/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <DetailItem icon={<Briefcase size={14}/>} label="Employee ID" value={employee.employeeId} />
                <DetailItem icon={<CalendarDays size={14}/>} label="Date of Joining" value={format(employee.dateOfJoining, 'dd MMM, yyyy')} />
                <DetailItem icon={<Phone size={14}/>} label="Mobile" value={employee.mobileNumber} />
                <DetailItem icon={<Droplets size={14}/>} label="Blood Group" value={employee.bloodGroup} />
                <DetailItem icon={<CalendarDays size={14}/>} label="Registration Date" value={format(employee.registrationDate, 'dd MMM, yyyy HH:mm')}/>
              </div>
               <DetailItem icon={<Home size={14}/>} label="Address" value={employee.address} />
            </div>
          </div>
          <div className="flex items-center justify-center mt-3 text-green-600"><ShieldCheck size={18} className="mr-2"/><p className="font-semibold text-sm">Verified Employee Record</p></div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-xl text-primary">ID Card Preview</CardTitle><CardDescription>Interactive preview of the employee's ID card.</CardDescription></CardHeader>
        <CardContent className="flex flex-col justify-center items-center p-4 gap-4">
            <EmployeeIdCard employee={employee} settings={cardSettings} showFlipButton={true} />
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
           <Button asChild className="bg-accent hover:bg-accent/80"><Link href={`/print-preview?employeeIds=${employee.employeeId}`} target="_blank"><Printer className="mr-2 h-4 w-4" /> Print ID Card</Link></Button>
        </CardFooter>
      </Card>

      {employee.printHistory && employee.printHistory.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2 text-primary"><History /> Print History</CardTitle><CardDescription>Card generated on:</CardDescription></CardHeader>
          <CardContent><ul className="list-disc pl-5 space-y-1 text-sm max-h-32 overflow-y-auto">{employee.printHistory.map((d, i) => <li key={i}>{format(d, 'dd MMM, yyyy HH:mm:ss')}</li>)}</ul></CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const { isLoading: authIsLoading } = useAuth();
  if (authIsLoading) return <div className="flex justify-center items-center min-h-screen"><p>Loading authentication...</p></div>;
  
  return (
    <ProtectedRoute>
      <EmployeeProfileContent employeeId={params.id} />
    </ProtectedRoute>
  );
}
