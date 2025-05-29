'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import type { StudentData } from '@/lib/types';
import StudentIdCard from './StudentIdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, UserPlus, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";


export default function StudentRegistrationForm() {
  const [formData, setFormData] = useState<Partial<StudentData>>({
    fullName: '',
    address: '',
    dateOfBirth: undefined,
    mobileNumber: '',
    prnNumber: '',
    rollNumber: '',
    yearOfJoining: '',
    courseName: '',
    photograph: null,
  });
  const [photographPreview, setPhotographPreview] = useState<string | null>(null);
  const [submittedStudent, setSubmittedStudent] = useState<StudentData | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { toast } = useToast();


  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date }));
  };
  
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photograph: file }));
      setPhotographPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.dateOfBirth) {
      toast({
        title: "Validation Error",
        description: "Please select a date of birth.",
        variant: "destructive",
      });
      return;
    }

    const newStudent: StudentData = {
      id: formData.prnNumber || crypto.randomUUID(), // Use PRN or generate UUID
      ...formData,
      fullName: formData.fullName || '',
      address: formData.address || '',
      dateOfBirth: formData.dateOfBirth,
      mobileNumber: formData.mobileNumber || '',
      prnNumber: formData.prnNumber || '',
      rollNumber: formData.rollNumber || '',
      yearOfJoining: formData.yearOfJoining || '',
      courseName: formData.courseName || '',
      photograph: formData.photograph,
      photographUrl: photographPreview || undefined,
      registrationDate: new Date(),
    };
    setSubmittedStudent(newStudent);
    toast({
      title: "Registration Successful!",
      description: `${newStudent.fullName}'s ID card has been generated.`,
    });
  };

  if (!isClient) {
    return <p>Loading form...</p>; // Or a skeleton loader
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UserPlus size={28} /> Student Registration
          </CardTitle>
          <CardDescription>Fill in the details below to register a new student and generate their ID card.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!formData.dateOfBirth && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photograph">Student Photograph</Label>
                <Input id="photograph" name="photograph" type="file" accept="image/*" onChange={handlePhotoChange} className="file:text-primary file:font-semibold"/>
                {photographPreview && (
                  <div className="mt-2">
                     <Image src={photographPreview} alt="Photograph preview" width={100} height={120} className="rounded-md border" data-ai-hint="student portrait"/>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="prnNumber">PRN Number</Label>
                <Input id="prnNumber" name="prnNumber" value={formData.prnNumber} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input id="rollNumber" name="rollNumber" value={formData.rollNumber} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearOfJoining">Year of Joining</Label>
                <Input id="yearOfJoining" name="yearOfJoining" type="number" placeholder="YYYY" value={formData.yearOfJoining} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input id="courseName" name="courseName" value={formData.courseName} onChange={handleChange} required />
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Register Student & Generate ID
            </Button>
          </form>
        </CardContent>
      </Card>

      {submittedStudent && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-center mb-6 text-primary">Generated ID Card Preview</h2>
          <StudentIdCard student={submittedStudent} />
        </div>
      )}
    </div>
  );
}
