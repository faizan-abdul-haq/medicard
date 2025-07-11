
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { EmployeeData, CardSettingsData, EmployeeType } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import EmployeeIdCard from './EmployeeIdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { CalendarIcon, UserPlus, Droplets, Printer, AlertTriangle, ShieldCheck, Loader2, ArrowLeft, Camera, UploadCloud, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { registerEmployee } from '@/services/employeeService';
import { getCardSettings } from '@/services/cardSettingsService';
import Webcam from 'react-webcam';
import ImageUploadField from '@/components/ImageUploadField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';


const initialFormData: Partial<Omit<EmployeeData, 'id' | 'registrationDate' | 'photographUrl'>> & { photograph?: File | null, dateOfJoining?: Date } = {
  fullName: '',
  address: '',
  dateOfJoining: undefined,
  mobileNumber: '',
  employeeId: '',
  department: '',
  designation: '',
  employeeType: 'STAFF',
  photograph: null,
  bloodGroup: '',
  cardHolderSignature: '',
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error('Invalid data URL');
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function EmployeeRegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [photographPreview, setPhotographPreview] = useState<string | null>(null);
  const [submittedEmployee, setSubmittedEmployee] = useState<EmployeeData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  
  const [inputMode, setInputMode] = useState<'upload' | 'webcam'>('upload');
  const webcamRef = useRef<Webcam>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (submittedEmployee && isAuthenticated) { 
      setIsLoadingSettings(true);
      getCardSettings(submittedEmployee.employeeType.toLowerCase() as 'faculty' | 'staff')
        .then(setCardSettings)
        .catch(() => toast({ title: "Error loading card settings", variant: "destructive"}))
        .finally(() => setIsLoadingSettings(false));
    }
  }, [submittedEmployee, isAuthenticated, toast]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfJoining: date }));
  };
  
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photograph: file }));
      setPhotographPreview(URL.createObjectURL(file));
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const file = dataURLtoFile(imageSrc, `webcam_capture_${Date.now()}.jpg`);
        setFormData(prev => ({ ...prev, photograph: file }));
        setPhotographPreview(imageSrc);
        toast({ title: "Photo Captured!"});
      }
    }
  };

  const requestCameraPermission = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
    } catch (error) {
        setHasCameraPermission(false);
        setWebcamError("Camera access denied. Please enable it in browser settings.");
    }
  };

  useEffect(() => {
    if (inputMode === 'webcam' && hasCameraPermission === null) {
      requestCameraPermission();
    }
  }, [inputMode, hasCameraPermission]);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.dateOfJoining || !formData.fullName || !formData.employeeId || !formData.employeeType) {
      toast({ title: "Validation Error", description: "Please fill all required fields, including employee type.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newEmployee = await registerEmployee({
        ...formData,
        dateOfJoining: formData.dateOfJoining,
        fullName: formData.fullName,
        employeeId: formData.employeeId,
        employeeType: formData.employeeType as EmployeeType,
      });
      
      toast({ 
        title: "Registration Successful!", 
        description: isAuthenticated 
          ? `${newEmployee.fullName}'s ID card has been generated.`
          : 'Your registration has been submitted for review.'
      });
      
      if (isAuthenticated) {
        setSubmittedEmployee(newEmployee);
      }
      
      setFormData(initialFormData);
      setPhotographPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Registration failed:", error);
      toast({ title: "Registration Failed", description: error instanceof Error ? error.message : "Could not register employee.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const employeeTypes: EmployeeType[] = ["FACULTY", "STAFF"];

  if (authIsLoading && !isAuthenticated) {
    return <div className="flex justify-center items-center min-h-[300px]"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <p className="ml-2">Loading form...</p></div>;
  }

  if (isAuthenticated && submittedEmployee) {
    return (
      <Card className="mt-12 max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-2">
            <ShieldCheck size={28}/> Registration Successful!
          </CardTitle>
          <CardDescription>Preview of the generated ID card for {submittedEmployee.fullName}.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {isLoadingSettings ? (
            <Loader2 className="h-6 w-6 animate-spin"/>
          ) : (
            <EmployeeIdCard employee={submittedEmployee} settings={cardSettings} showFlipButton={true} />
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-2">
          <Button variant="outline" onClick={() => setSubmittedEmployee(null)}>Register Another Employee</Button>
          <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground">
            <Link href={`/print-preview?employeeIds=${submittedEmployee.employeeId}`} target="_blank">
              <Printer className="mr-2 h-4 w-4" /> Print This Card
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Briefcase size={28} /> Employee Registration
        </CardTitle>
        <CardDescription>Fill in the details to register a new employee. Fields with <span className="text-destructive">*</span> are required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Personal & Work Details</h3>
            <Separator />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID <span className="text-destructive">*</span></Label>
              <Input id="employeeId" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Input id="department" name="department" value={formData.department || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation <span className="text-destructive">*</span></Label>
              <Input id="designation" name="designation" value={formData.designation || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <Label htmlFor="employeeType">Employee Type <span className="text-destructive">*</span></Label>
              <Select value={formData.employeeType || ''} onValueChange={(value) => handleSelectChange('employeeType', value)} required>
                <SelectTrigger><SelectValue placeholder="Select employee type" /></SelectTrigger>
                <SelectContent>
                  {employeeTypes.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formData.dateOfJoining && "text-muted-foreground"}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfJoining ? format(formData.dateOfJoining, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.dateOfJoining} onSelect={handleDateChange} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Photograph (Max 2MB)</Label>
              <div className="flex gap-2 mb-2">
                <Button type="button" variant={inputMode === 'upload' ? 'default' : 'outline'} onClick={() => setInputMode('upload')}><UploadCloud className="mr-2 h-4 w-4" /> Upload</Button>
                <Button type="button" variant={inputMode === 'webcam' ? 'default' : 'outline'} onClick={() => setInputMode('webcam')}><Camera className="mr-2 h-4 w-4" /> Webcam</Button>
              </div>
              {inputMode === 'upload' && <Input id="photographFile" name="photographFile" type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef}/>}
              {inputMode === 'webcam' && (
                <div className="space-y-2">
                  <div className="border rounded-md overflow-hidden w-full aspect-video bg-muted">
                    {hasCameraPermission ? <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" /> : <p className="text-destructive p-4">{webcamError || "Requesting camera..."}</p>}
                  </div>
                  {hasCameraPermission && <Button type="button" onClick={capturePhoto} className="w-full" variant="outline"><Camera className="mr-2 h-4 w-4" /> Capture</Button>}
                </div>
              )}
              {photographPreview && <Image src={photographPreview} alt="Photograph preview" width={100} height={120} className="rounded-md border mt-2" data-ai-hint="employee portrait" unoptimized/>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select value={formData.bloodGroup || ''} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {bloodGroups.map(group => <SelectItem key={group} value={group}><Droplets size={14} className="inline mr-2 text-red-500"/>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="space-y-2">
              <ImageUploadField label="Card Holder's Signature" value={formData.cardHolderSignature} onChange={(url) => setFormData(prev => ({ ...prev, cardHolderSignature: url }))} directory="signatures" maxSizeKB={1024} note="Upload a pre-signed image."/>
            </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Registering...' : (isAuthenticated ? 'Register Employee & Generate ID' : 'Submit Registration')}
          </Button>
        </form>
      </CardContent>
      {isAuthenticated && (
        <CardFooter>
          <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
        </CardFooter>
      )}
    </Card>
  );
}
