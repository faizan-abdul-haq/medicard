
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { CalendarIcon, UserCog, Droplets, AlertTriangle, Loader2, Save, Camera, UploadCloud, Trash2, Book } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from '@/services/studentService';
import { getCardSettings } from '@/services/cardSettingsService';
import Webcam from 'react-webcam';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

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

interface StudentEditFormProps {
  studentToEdit: StudentData;
  onUpdateSuccess: (updatedStudent: StudentData) => void;
  onCancel: () => void;
}

export default function StudentEditForm({ studentToEdit, onUpdateSuccess, onCancel }: StudentEditFormProps) {
  const [formData, setFormData] = useState<Partial<StudentData>>({});
  const [newPhotographFile, setNewPhotographFile] = useState<File | null>(null);
  const [photographPreview, setPhotographPreview] = useState<string | null>(studentToEdit.photographUrl || null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'webcam'>('upload');
  const webcamRef = useRef<Webcam>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null: not yet requested, true: granted, false: denied/error
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({
      ...studentToEdit,
      dateOfBirth: studentToEdit.dateOfBirth ? new Date(studentToEdit.dateOfBirth) : undefined,
    });
    setPhotographPreview(studentToEdit.photographUrl || "https://placehold.co/80x100.png");
    setNewPhotographFile(null);
    setInputMode('upload');
    setHasCameraPermission(null);
    setWebcamError(null);
  }, [studentToEdit]);

  useEffect(() => {
    setIsLoadingSettings(true);
    getCardSettings()
      .then(setCardSettings)
      .catch(() => {
        toast({ title: "Error loading card settings for preview", variant: "destructive"});
        setCardSettings(DEFAULT_CARD_SETTINGS); 
      })
      .finally(() => setIsLoadingSettings(false));
  }, [toast]);

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

  const handleNewPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a valid image file (JPEG, PNG, GIF).", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File Too Large", description: "Image size should not exceed 2MB.", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setNewPhotographFile(file);
      setPhotographPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photographUrl: undefined }));
    }
  };
  
  const removePhoto = () => {
    setNewPhotographFile(null);
    setPhotographPreview("https://placehold.co/80x100.png");
    setFormData(prev => ({ ...prev, photographUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    // No specific action for webcam here, as capture replaces, remove clears.
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const file = dataURLtoFile(imageSrc, `webcam_capture_${Date.now()}.jpg`);
        setNewPhotographFile(file);
        setPhotographPreview(imageSrc);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFormData(prev => ({ ...prev, photographUrl: undefined }));
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
        // Assign stream to videoRef if you were directly controlling a <video> element
        // For react-webcam, its `onUserMedia` prop handles this successfully.
        // If react-webcam's `onUserMedia` is not firing as expected, this explicit call might be needed.
        if (webcamRef.current && webcamRef.current.video) {
            webcamRef.current.video.srcObject = stream;
        }
        toast({ title: "Webcam Activated", description: "Camera is ready." });

    } catch (error) {
        handleUserMediaError(error as (String | DOMException));
    }
  };

  useEffect(() => {
    if (inputMode === 'webcam' && hasCameraPermission === null) { // Request permission when switching to webcam mode if not already determined
       requestCameraPermission();
    }
  }, [inputMode, hasCameraPermission]);


  const handleUserMedia = () => { setHasCameraPermission(true); setWebcamError(null); };
  const handleUserMediaError = (error: String | DOMException) => {
    console.error("Webcam error:", error);
    setHasCameraPermission(false);
    let msg = "Could not access webcam. ";
    if (typeof error === 'string') msg += error;
    else if (error.name === "NotAllowedError") msg += "Permission denied. Please enable camera access in your browser settings.";
    else if (error.name === "NotFoundError") msg += "No camera found. Please ensure a webcam is connected and not in use by another app.";
    else msg += "An unknown error occurred."
    setWebcamError(msg);
    toast({ variant: 'destructive', title: 'Webcam Access Error', description: msg });
    setInputMode('upload');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.dateOfBirth) {
      toast({ title: "Validation Error", description: "Date of birth is required.", variant: "destructive" });
      return;
    }
     if (formData.mobileNumber && !MOBILE_REGEX.test(formData.mobileNumber)) {
      toast({ title: "Validation Error", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const { id, prnNumber, registrationDate, photograph, ...dataToSubmit } = formData; 

    try {
      const updatedData = await updateStudent(
        studentToEdit.id, 
        {
            ...dataToSubmit,
            prnNumber: formData.prnNumber,
            dateOfBirth: formData.dateOfBirth,
            bloodGroup: formData.bloodGroup === "NO_GROUP" ? undefined : formData.bloodGroup,
        },
        newPhotographFile,
        studentToEdit.photographUrl 
      );
      
      toast({ title: "Update Successful!", description: `${updatedData.fullName}'s details have been updated.` });
      onUpdateSuccess(updatedData);
    } catch (error) {
      console.error("Update failed:", error);
      toast({ title: "Update Failed", description: (error as Error).message || "Could not update student details.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const yearsOfStudy = ["FIRST", "SECOND", "THIRD", "FOURTH", "FINAL"];
  const courseNames = ["MBBS", "BPMT-BLD TRANS", "BPMT-CARDIO", "BPMT-CM", "BPMT-EM", "BPMT-ENDO", "BPMT-FM", "BPMT-LAB", "BPMT-NEURO", "BPMT-OT", "BPMT-OPT", "BPMT-PERF", "BPMT-RADIOGR", "PG-ANAES", "PG-ANATOMY", "PG-BIOCHEM", "PG-CM", "PG-DERMAT", "PG-EM", "PG-FM & TOXICOLOGY", "PG-GerMed", "PG-IHBT", "PG-MED", "PG-MICRO", "PG-OBGY", "PG-OPTH", "PG-ORTHO", "PG-ENT", "PG-PAEDS", "PG-PATH", "PG-PHARMA", "PG-PHYSIO", "PG-PSYCHIATRY", "PG-PulMed","PG DMLT", "PG-RADIODIAGNOSIS", "PG-SURGERY", , "SUPS-CARDIOLOGY", "SUPS-CVTS", "SUPS-IntRad", "SUPS-NEPHRO", "SUPS-NEURO SX", "SUPS-NEUROLOGY", "SUPS-PAEDS SX", "SUPS-Plast SX", "SUPS-UROLOGY", "FLW-CARDIO-ANAES", "FLW-CNEPHRO", "FLW-DEADDICTION", "FLW-HIGH RISK OBST", "FLW-JTR SX", "FLW-LD & NEURO PAED", "FLW-MASX – GYNAE", "FLW-NEONATOLOGY", "FLW-NEURO-ANAEST", "FLW-PAED-ANAES", "FLW-SPINE SX", "FLW-VR SURGERY", , "MPH-N", , "Ph.D-FM & TOXICOLOGY", "Ph.D-GS", "Ph.D-MEDI BIOCHEM", "Ph.D-MEDI MICROB", "Ph.D-ORTHOPAEDICS", "Ph.D-ENT"]

  const previewStudentData: StudentData = {
    ...studentToEdit,
    ...formData,
    photographUrl: photographPreview || studentToEdit.photographUrl || "https://placehold.co/80x100.png",
    dateOfBirth: formData.dateOfBirth || studentToEdit.dateOfBirth,
    id: studentToEdit.id,
    prnNumber: studentToEdit.prnNumber,
    registrationDate: studentToEdit.registrationDate,
  };

  return (
    <div className="space-y-8">
      <Card className="mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <UserCog size={24} /> Edit Student: {studentToEdit.fullName} (PRN: {studentToEdit.prnNumber})
          </CardTitle>
          <CardDescription>Modify the student's details below. Click "Save Changes" to update.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">Personal & Academic</h3>
                    <Separator />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                        <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="prnNumber">PRN Number</Label> {/* You might want to update the label too */}
                        <Input id="prnNumber" name="prnNumber" value={formData.prnNumber || ''} onChange={handleChange} required /> 
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="rollNumber">Roll Number <span className="text-destructive">*</span></Label>
                        <Input id="rollNumber" name="rollNumber" value={formData.rollNumber || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="mobileNumber">Mobile Number (10 digits)</Label>
                        <Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber || ''} onChange={handleChange} pattern="\d{10}" title="Mobile number must be 10 digits"/>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    {formData.courseName}
                        <Label htmlFor="courseName">Course Name <span className="text-destructive">*</span></Label>
                        {/* <Input id="courseName" name="courseName" value={formData.courseName || ''} onChange={handleChange} required /> */}
                        <Select required value={formData.courseName} onValueChange={(value) => handleSelectChange('courseName', value)}>
                          <SelectTrigger id="courseName"><SelectValue placeholder="Select Course" /></SelectTrigger>
                          <SelectContent>
                              {courseNames.map((course) => <SelectItem key={course} value={course}><Book size={14} className="inline mr-2 text-green-500"/>{course}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="yearOfJoining">Year of Study <span className="text-destructive">*</span></Label>
                        <Select value={formData.yearOfJoining || 'FIRST'} onValueChange={(value) => handleSelectChange('yearOfJoining', value)} required>
                        <SelectTrigger id="yearOfJoining"><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                            {yearsOfStudy.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!formData.dateOfBirth && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), "dd/MM/yyyy") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined} onSelect={handleDateChange} initialFocus captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear() - 10} required/>
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label>Student Photograph (Max 2MB)</Label>
                         <div className="flex gap-1 mb-1">
                            <Button type="button" size="sm" variant={inputMode === 'upload' ? 'secondary' : 'outline'} onClick={() => { setInputMode('upload'); setHasCameraPermission(true); /* Assume if they switch, they don't want to re-trigger permission prompt unless cam fails */}} className="text-xs px-2 py-1 h-auto"><UploadCloud className="mr-1 h-3 w-3" /> Upload</Button>
                            <Button type="button" size="sm" variant={inputMode === 'webcam' ? 'secondary' : 'outline'} onClick={() => { setInputMode('webcam'); if(hasCameraPermission !== true) requestCameraPermission();}} className="text-xs px-2 py-1 h-auto"><Camera className="mr-1 h-3 w-3" /> Webcam</Button>
                            {(photographPreview && photographPreview !== "https://placehold.co/80x100.png") && (
                                <Button type="button" size="sm" variant="destructive" onClick={removePhoto} className="text-xs px-2 py-1 h-auto"><Trash2 className="mr-1 h-3 w-3" /> Remove</Button>
                            )}
                        </div>
                        {inputMode === 'upload' && <Input id="photographFile" name="photographFile" type="file" accept="image/jpeg, image/png, image/gif" onChange={handleNewPhotoChange} ref={fileInputRef} className="h-9 text-xs"/>}
                        {inputMode === 'webcam' && (
                            <div className="space-y-1">
                                <div className="border rounded-md overflow-hidden w-full aspect-[4/3] bg-muted max-h-[150px]">
                                   {hasCameraPermission === true ? (
                                        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user", aspectRatio: 4/3 }} className="w-full h-full object-cover" onUserMedia={handleUserMedia} onUserMediaError={handleUserMediaError}/>
                                   ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                            {hasCameraPermission === false ? "Camera access denied or error." : "Requesting camera..."}
                                        </div>
                                   )}
                                </div>
                                {webcamError && hasCameraPermission === false && <Alert variant="destructive" className="p-2 text-xs"><AlertTriangle className="h-3 w-3"/><AlertTitle className="text-xs">Webcam Error</AlertTitle><ShadcnAlertDescription className="text-xs">{webcamError}</ShadcnAlertDescription></Alert>}
                                {hasCameraPermission === true && <Button type="button" onClick={capturePhoto} className="w-full h-8 text-xs" variant="outline"><Camera className="mr-1 h-3 w-3" /> Capture Photo</Button>}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Enter full residential address"/>
                </div>

                <div className="space-y-1 pt-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">Medical Info</h3>
                    <Separator />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select value={formData.bloodGroup || 'NO_GROUP'} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                        <SelectTrigger id="bloodGroup"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                            {bloodGroups.map((group) => <SelectItem key={group} value={group}><Droplets size={14} className="inline mr-2 text-red-500"/>{group}</SelectItem>)}
                            <SelectItem value="NO_GROUP">None</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </form>

            <div className="space-y-2 sticky top-8">
                <h3 className="text-lg font-semibold text-center text-foreground">Live ID Card Preview</h3>
                {isLoadingSettings ? (
                    <div className="flex justify-center items-center h-[210px]"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-muted-foreground">Front Side:</p>
                        <StudentIdCard student={previewStudentData} settings={cardSettings} showFlipButton={false} initialSide="front" />
                        <p className="text-xs text-muted-foreground mt-1">Back Side:</p>
                        <StudentIdCard student={previewStudentData} settings={cardSettings} showFlipButton={false} initialSide="back" />
                    </div>
                )}
                 {photographPreview && (
                    <div className="mt-2 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Current Photograph:</p>
                        <Image src={photographPreview} alt="Photograph preview" width={80} height={100} className="rounded-md border object-cover inline-block" data-ai-hint="student portrait" unoptimized/>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
