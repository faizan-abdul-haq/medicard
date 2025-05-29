
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import type { StudentData } from '@/lib/types';
import StudentIdCard from './StudentIdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CalendarIcon, UserPlus, Droplets, Printer, AlertTriangle, ShieldCheck, HeartPulse, PhoneCall, Users } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { registerStudent } from '@/services/studentService'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

const initialFormData: Partial<Omit<StudentData, 'id' | 'registrationDate' | 'photographUrl'>> & { photograph?: File | null, dateOfBirth?: Date } = {
  fullName: '',
  address: '',
  dateOfBirth: undefined,
  mobileNumber: '',
  prnNumber: '',
  rollNumber: '',
  yearOfJoining: 'FIRST', 
  courseName: '',
  photograph: null,
  bloodGroup: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  allergies: '',
  medicalConditions: '',
};

export default function StudentRegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [photographPreview, setPhotographPreview] = useState<string | null>(null);
  const [submittedStudent, setSubmittedStudent] = useState<StudentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

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
        e.target.value = ''; 
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File Too Large",
          description: "Image size should not exceed 2MB.",
          variant: "destructive",
        });
        e.target.value = ''; 
        return;
      }
      setFormData(prev => ({ ...prev, photograph: file }));
      setPhotographPreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, photograph: null }));
      setPhotographPreview(null);
    }
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

    setIsSubmitting(true);
    try {
      // Ensure all required fields are present for the service call
      const studentToRegister = {
        fullName: formData.fullName!,
        address: formData.address || 'N/A',
        dateOfBirth: formData.dateOfBirth!,
        mobileNumber: formData.mobileNumber || 'N/A',
        prnNumber: formData.prnNumber!,
        rollNumber: formData.rollNumber!,
        yearOfJoining: formData.yearOfJoining!,
        courseName: formData.courseName!,
        bloodGroup: formData.bloodGroup || undefined,
        photograph: formData.photograph || null, // Pass the File object
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        allergies: formData.allergies || undefined,
        medicalConditions: formData.medicalConditions || undefined,
      };

      const newStudent = await registerStudent(studentToRegister);
      
      // The newStudent from service will have the photographUrl from storage
      setSubmittedStudent(newStudent);
      
      toast({
        title: "Registration Successful!",
        description: `${newStudent.fullName}'s ID card has been generated.`,
      });
      
      setFormData(initialFormData); // Reset form to initial state
      setPhotographPreview(null);
      const form = e.target as HTMLFormElement;
      if (form) form.reset(); // Resets native form elements like file input
      
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


  return (
    <div className="space-y-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UserPlus size={28} /> Student Registration
          </CardTitle>
          <CardDescription>Fill in the details below to register a new student and generate their ID card. Fields marked with <span className="text-destructive">*</span> are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Details Section */}
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Users size={20}/> Personal & Academic Details</h3>
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
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber || ''} onChange={handleChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name <span className="text-destructive">*</span></Label>
                <Input id="courseName" name="courseName" value={formData.courseName || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearOfJoining">Year of Study <span className="text-destructive">*</span></Label>
                 <Select value={formData.yearOfJoining || 'FIRST'} onValueChange={(value) => handleSelectChange('yearOfJoining', value)} required>
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
                      toYear={new Date().getFullYear() - 10} 
                      required
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photograph">Student Photograph (Max 2MB)</Label>
                <Input id="photograph" name="photograph" type="file" accept="image/jpeg, image/png, image/gif" onChange={handlePhotoChange} className="file:text-primary file:font-semibold"/>
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

            {/* Medical Details Section */}
            <div className="space-y-1 pt-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><HeartPulse size={20}/> Medical Information</h3>
                <Separator />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={formData.bloodGroup || ''} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                    <SelectTrigger id="bloodGroup" className="w-full">
                        <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                        {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}> <Droplets size={14} className="inline mr-2 text-red-500"/> {group}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleChange} placeholder="e.g., Jane Doe"/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone || ''} onChange={handleChange} placeholder="e.g., 555-123-4567"/>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea id="allergies" name="allergies" value={formData.allergies || ''} onChange={handleChange} placeholder="e.g., Peanuts, Penicillin"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="medicalConditions">Known Medical Conditions</Label>
                <Textarea id="medicalConditions" name="medicalConditions" value={formData.medicalConditions || ''} onChange={handleChange} placeholder="e.g., Asthma, Diabetes"/>
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : <><UserPlus className="mr-2 h-5 w-5" /> Register Student & Generate ID</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submittedStudent && (
        <Card className="mt-12 max-w-3xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-2">
                <ShieldCheck size={28}/> Registration Successful!
            </CardTitle>
            <CardDescription>Preview of the generated ID card for {submittedStudent.fullName}.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             <StudentIdCard student={submittedStudent} showFlipButton={true} />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <Button variant="outline" onClick={() => {
              setSubmittedStudent(null);
            }}>
              Register Another Student
            </Button>
             <Button asChild>
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
