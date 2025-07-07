
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { StudentData, CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import StudentIdCard from './StudentIdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { CalendarIcon, UserPlus, Droplets, Printer, AlertTriangle, ShieldCheck, Loader2, ArrowLeft, Camera, UploadCloud,Book  } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { registerStudent } from '@/services/studentService';
import { getCardSettings } from '@/services/cardSettingsService';
import Webcam from 'react-webcam';
import SignaturePad from '@/components/SignaturePad';
import ImageUploadField from '@/components/ImageUploadField';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth


const initialFormData: Partial<Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'>> & { photograph?: File | null, dateOfBirth?: Date } = {
  fullName: '',
  address: '',
  dateOfBirth: undefined,
  mobileNumber: '',
  prnNumber: '',
  rollNumber: '',
  yearOfJoining: '',
  courseName: '',
  photograph: null,
  bloodGroup: '',
  cardHolderSignature: '',
};

const MOBILE_REGEX = /^\d{10}$/;

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL: Missing MIME type');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};


export default function StudentRegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [photographPreview, setPhotographPreview] = useState<string | null>(null);
  const [submittedStudent, setSubmittedStudent] = useState<StudentData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // Get auth state

  const [inputMode, setInputMode] = useState<'upload' | 'webcam'>('upload');
  const webcamRef = useRef<Webcam>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // Fetch card settings only if an admin is logged in and a student has been submitted (for preview)
    if (submittedStudent && isAuthenticated) { 
      setIsLoadingSettings(true);
      getCardSettings()
        .then(setCardSettings)
        .catch(() => {
          toast({ title: "Error loading card settings for preview", variant: "destructive"});
          setCardSettings(DEFAULT_CARD_SETTINGS); 
        })
        .finally(() => setIsLoadingSettings(false));
    }
  }, [submittedStudent, isAuthenticated, toast]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, GIF).",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File Too Large",
          description: "Image size should not exceed 2MB.",
          variant: "destructive",
        });
         if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, photograph: file }));
      setPhotographPreview(URL.createObjectURL(file));
      if (inputMode === 'webcam' && webcamRef.current) {
        // Potentially stop webcam tracks if active
      }
    } else {
      if (!formData.photograph) { 
        setFormData(prev => ({ ...prev, photograph: null }));
        setPhotographPreview(null);
      }
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const file = dataURLtoFile(imageSrc, `webcam_capture_${Date.now()}.jpg`);
        setFormData(prev => ({ ...prev, photograph: file }));
        setPhotographPreview(imageSrc);
        if (fileInputRef.current) { 
          fileInputRef.current.value = "";
        }
        toast({ title: "Photo Captured!", description: "Image from webcam is ready."});
      } else {
        toast({ title: "Capture Failed", description: "Could not capture image from webcam.", variant: "destructive"});
      }
    }
  };
  
  const requestCameraPermission = async () => {
    setWebcamError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        const msg = "Webcam not supported by this browser.";
        setWebcamError(msg);
        toast({ variant: 'destructive', title: 'Webcam Access Error', description: msg });
        setInputMode('upload');
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (webcamRef.current && webcamRef.current.video) {
            webcamRef.current.video.srcObject = stream;
        }
        toast({ title: "Webcam Activated", description: "Camera is ready." });

    } catch (error) {
        handleUserMediaError(error as (String | DOMException));
    }
  };

  useEffect(() => {
    if (inputMode === 'webcam' && hasCameraPermission === null) { 
       requestCameraPermission();
    }
  }, [inputMode, hasCameraPermission]);


  const handleUserMedia = () => {
    setHasCameraPermission(true);
    setWebcamError(null);
    // toast({ title: "Webcam Activated", description: "Camera is ready."}); // Already toasted in requestCameraPermission
  };

  const handleUserMediaError = (error: String | DOMException) => {
    console.error("Webcam error:", error);
    setHasCameraPermission(false);
    let errorMessage = "Could not access webcam. ";
    if (typeof error === 'string') {
      errorMessage += error;
    } else if (error.name === "NotAllowedError") {
      errorMessage += "Permission denied. Please enable camera access in your browser settings.";
    } else if (error.name === "NotFoundError") {
      errorMessage += "No camera found. Please ensure a webcam is connected.";
    } else {
      errorMessage += "An unknown error occurred."
    }
    setWebcamError(errorMessage);
    toast({
      variant: 'destructive',
      title: 'Webcam Access Error',
      description: errorMessage,
    });
    setInputMode('upload'); 
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.dateOfBirth) {
      toast({
        title: "Validation Error",
        description: "Please select a date of birth.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.fullName || !formData.prnNumber || !formData.rollNumber || !formData.courseName || !formData.yearOfJoining) {
      toast({
        title: "Validation Error",
        description: "Please fill all required personal and academic fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.mobileNumber && !MOBILE_REGEX.test(formData.mobileNumber)) {
      toast({
        title: "Validation Error",
        description: "Mobile number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }


    setIsSubmitting(true);
    try {
      const studentToRegister = {
        fullName: formData.fullName!,
        address: formData.address || 'N/A',
        dateOfBirth: formData.dateOfBirth!,
        mobileNumber: formData.mobileNumber && MOBILE_REGEX.test(formData.mobileNumber) ? formData.mobileNumber : 'N/A',
        prnNumber: formData.prnNumber!,
        rollNumber: formData.rollNumber!,
        yearOfJoining: formData.yearOfJoining!,
        courseName: formData.courseName!,
        photograph: formData.photograph,
        bloodGroup: formData.bloodGroup === "NO_GROUP" ? undefined : formData.bloodGroup || undefined,
        cardHolderSignature: formData.cardHolderSignature || '',
      };

      const newStudent = await registerStudent(studentToRegister);
      
      if (isAuthenticated) { // Admin submitted
        setSubmittedStudent(newStudent);
        toast({
          title: "Registration Successful!",
          description: `${newStudent.fullName}'s ID card has been generated.`,
        });
      } else { // Student submitted
        setSubmittedStudent(null); // Don't show card preview for student
         toast({
          title: "Registration Submitted!",
          description: "Your registration has been submitted successfully. It will be reviewed by an administrator.",
          duration: 7000,
        });
      }


      setFormData(initialFormData);
      setPhotographPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setHasCameraPermission(null); 
      setWebcamError(null);
      setInputMode('upload');
      const form = e.target as HTMLFormElement;
      if (form) {
         const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
         if (fileInput) {
             fileInput.value = '';
         }
      }

    } catch (error) {
      console.error("Registration failed:", error);
      let errorMessage = "Could not register student. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const yearsOfStudy = ["FIRST", "SECOND", "THIRD", "FOURTH", "FINAL"];
  const courseNames = ["MBBS", "BPMT-BLD TRANS", "BPMT-CARDIO", "BPMT-CM", "BPMT-EM", "BPMT-ENDO", "BPMT-FM", "BPMT-LAB", "BPMT-NEURO", "BPMT-OT", "BPMT-OPT", "BPMT-PERF", "BPMT-RADIOGR", "PG-ANAES", "PG-ANATOMY", "PG-BIOCHEM", "PG-CM", "PG-DERMAT", "PG-EM", "PG-FM & TOXICOLOGY", "PG-GerMed", "PG-IHBT", "PG-MED", "PG-MICRO", "PG-OBGY", "PG-OPTH", "PG-ORTHO", "PG-ENT", "PG-PAEDS", "PG-PATH", "PG-PHARMA", "PG-PHYSIO", "PG-PSYCHIATRY", "PG-PulMed","PG DMLT", "PG-RADIODIAGNOSIS", "PG-SURGERY", , "SUPS-CARDIOLOGY", "SUPS-CVTS", "SUPS-IntRad", "SUPS-NEPHRO", "SUPS-NEURO SX", "SUPS-NEUROLOGY", "SUPS-PAEDS SX", "SUPS-Plast SX", "SUPS-UROLOGY", "FLW-CARDIO-ANAES", "FLW-CNEPHRO", "FLW-DEADDICTION", "FLW-HIGH RISK OBST", "FLW-JTR SX", "FLW-LD & NEURO PAED", "FLW-MASX – GYNAE", "FLW-NEONATOLOGY", "FLW-NEURO-ANAEST", "FLW-PAED-ANAES", "FLW-SPINE SX", "FLW-VR SURGERY", , "MPH-N", , "Ph.D-FM & TOXICOLOGY", "Ph.D-GS", "Ph.D-MEDI BIOCHEM", "Ph.D-MEDI MICROB", "Ph.D-ORTHOPAEDICS", "Ph.D-ENT"]

  if (authIsLoading && !isAuthenticated) { // Show a simple loading for students accessing the form
    return <div className="flex justify-center items-center min-h-[300px]"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <p className="ml-2">Loading form...</p></div>;
  }


  return (
    <div className="space-y-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UserPlus size={28} /> Student Registration
          </CardTitle>
          <CardDescription>Fill in the details below to register. Fields marked with <span className="text-destructive">*</span> are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">Personal & Academic Details</h3>
                <Separator />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prnNumber">PRN Number <span className="text-destructive">*</span></Label>
                <Input id="prnNumber" name="prnNumber" value={formData.prnNumber || ''} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number <span className="text-destructive">*</span></Label>
                <Input id="rollNumber" name="rollNumber" value={formData.rollNumber || ''} onChange={handleChange} required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number (10 digits)</Label>
                <Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber || ''} onChange={handleChange} pattern="\d{10}" title="Mobile number must be 10 digits"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name <span className="text-destructive">*</span></Label>
                {/* <Input id="courseName" name="courseName" value={formData.courseName || ''} onChange={handleChange} required /> */}
                <Select required value={formData.courseName} onValueChange={(value) => handleSelectChange('courseName', value)}>
                  <SelectTrigger id="courseName" className="w-full">
                      <SelectValue placeholder="Select Course Name" />
                  </SelectTrigger>
                  <SelectContent>
                      {courseNames.map((course) => (
                      <SelectItem key={course} value={course}> <Book size={14} className="inline mr-2 text-green-500"/> {course}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearOfJoining">Year of Study <span className="text-destructive">*</span></Label>
                 <Select value={formData.yearOfJoining} onValueChange={(value) => handleSelectChange('yearOfJoining', value)} required>
                  <SelectTrigger id="yearOfJoining">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsOfStudy.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!formData.dateOfBirth && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth ? format(formData.dateOfBirth, "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfBirth}
                      onSelect={handleDateChange}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                      required
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Student Photograph (Max 2MB)</Label>
                <div className="flex gap-2 mb-2">
                    <Button type="button" variant={inputMode === 'upload' ? 'default' : 'outline'} onClick={() => setInputMode('upload')}>
                        <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                    </Button>
                    <Button type="button" variant={inputMode === 'webcam' ? 'default' : 'outline'} onClick={() => { setInputMode('webcam'); if (hasCameraPermission !== true) requestCameraPermission();}}>
                        <Camera className="mr-2 h-4 w-4" /> Use Webcam
                    </Button>
                </div>

                {inputMode === 'upload' && (
                    <Input 
                        id="photographFile" 
                        name="photographFile" 
                        type="file" 
                        accept="image/jpeg, image/png, image/gif" 
                        onChange={handlePhotoChange} 
                        ref={fileInputRef}
                        className="file:text-primary file:font-semibold"
                    />
                )}

                {inputMode === 'webcam' && (
                    <div className="space-y-2">
                        <div className="border rounded-md overflow-hidden w-full aspect-video bg-muted">
                             <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "user", aspectRatio: 16/9 }}
                                className="w-full h-full object-cover"
                                onUserMedia={handleUserMedia}
                                onUserMediaError={handleUserMediaError}
                              />
                        </div>
                        {hasCameraPermission === false && webcamError && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4"/>
                                <AlertTitle>Webcam Error</AlertTitle>
                                <ShadcnAlertDescription>{webcamError}</ShadcnAlertDescription>
                            </Alert>
                        )}
                        {hasCameraPermission === true && (
                            <Button type="button" onClick={capturePhoto} className="w-full" variant="outline">
                                <Camera className="mr-2 h-4 w-4" /> Capture Photo
                            </Button>
                        )}
                         {hasCameraPermission === null && !webcamError && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting camera access...
                            </div>
                        )}
                    </div>
                )}
                 {photographPreview && (
                  <div className="mt-2">
                      <Image src={photographPreview} alt="Photograph preview" width={100} height={120} className="rounded-md border object-cover" data-ai-hint="student portrait" unoptimized/>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Enter full residential address"/>
            </div>

            <div className="space-y-1 pt-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">Medical Information</h3>
                <Separator />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={formData.bloodGroup || ''} onValueChange={(value) => handleSelectChange('bloodGroup', value === "NO_GROUP" ? "" : value)}>
                    <SelectTrigger id="bloodGroup" className="w-full">
                        <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                        {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}> <Droplets size={14} className="inline mr-2 text-red-500"/> {group}</SelectItem>
                        ))}
                         <SelectItem value="NO_GROUP">None</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <ImageUploadField
                label="Card Holder's Signature"
                value={formData.cardHolderSignature}
                onChange={(url) => setFormData(prev => ({ ...prev, cardHolderSignature: url }))}
                directory="signatures"
                maxSizeKB={1024}
                note="Sign with a blue marker on white paper, remove background, and upload in landscape."
              />
              {/* <SignaturePad
              label="Card Holder's Signature"
              value={formData.cardHolderSignature || ''}
              onChange={(dataUrl) => setFormData(prev => ({ ...prev, cardHolderSignature: dataUrl }))}
              /> */}
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base" disabled={isSubmitting || (inputMode === 'webcam' && hasCameraPermission === null && !webcamError) }>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <UserPlus className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Registering...' : (isAuthenticated ? 'Register Student & Generate ID' : 'Submit Registration')}
            </Button>
          </form>
        </CardContent>
         {isAuthenticated && ( // Only show "Go Back" for authenticated admin users
            <CardFooter className="pt-6">
                <Button variant="outline" onClick={() => router.back()} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </CardFooter>
         )}
      </Card>

      {/* Conditional rendering for submitted student card preview (only for admins) */}
      {isAuthenticated && submittedStudent && (
        <Card className="mt-12 max-w-3xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-2">
                <ShieldCheck size={28}/> Registration Successful!
            </CardTitle>
            <CardDescription>Preview of the generated ID card for {submittedStudent.fullName}.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoadingSettings ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin"/> Loading card preview with latest settings...
              </div>
            ) : (
              <StudentIdCard student={submittedStudent} settings={cardSettings} showFlipButton={true} />
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <Button variant="outline" onClick={() => {
              setSubmittedStudent(null); // Clear submitted student to allow new admin registration
            }}>
              Register Another Student
            </Button>
             <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground">
                <Link href={`/print-preview?studentIds=${submittedStudent.prnNumber}`} target="_blank">
                  <Printer className="mr-2 h-4 w-4" /> Print This Card
                </Link>
              </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
