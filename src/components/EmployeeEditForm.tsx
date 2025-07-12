
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { EmployeeData, CardSettingsData, EmployeeType } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import EmployeeIdCard from './EmployeeIdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCog, Droplets, Loader2, Save, Camera, UploadCloud, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { updateEmployee } from '@/services/employeeService';
import { getCardSettings } from '@/services/cardSettingsService';
import Webcam from 'react-webcam';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error('Invalid data URL');
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, { type: mime });
};

interface EmployeeEditFormProps {
  employeeToEdit: EmployeeData;
  onUpdateSuccess: (updatedEmployee: EmployeeData) => void;
  onCancel: () => void;
}

export default function EmployeeEditForm({ employeeToEdit, onUpdateSuccess, onCancel }: EmployeeEditFormProps) {
  const [formData, setFormData] = useState<Partial<EmployeeData>>({});
  const [newPhotographFile, setNewPhotographFile] = useState<File | null>(null);
  const [photographPreview, setPhotographPreview] = useState<string | null>(employeeToEdit.photographUrl || null);
  const [cardSettings, setCardSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'webcam'>('upload');
  const webcamRef = useRef<Webcam>(null);
 
  useEffect(() => {
    setFormData({
      ...employeeToEdit,
    });
    setPhotographPreview(employeeToEdit.photographUrl || "https://placehold.co/80x100.png");
  }, [employeeToEdit]);

  useEffect(() => {
    getCardSettings().then(setCardSettings).finally(() => setIsLoadingSettings(false));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleNewPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotographFile(file);
      setPhotographPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photographUrl: undefined }));
    }
  };
  
  const removePhoto = () => {
    setNewPhotographFile(null);
    setPhotographPreview("https://placehold.co/80x100.png");
    setFormData(prev => ({ ...prev, photographUrl: null }));
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const file = dataURLtoFile(imageSrc, `webcam_${Date.now()}.jpg`);
        setNewPhotographFile(file);
        setPhotographPreview(imageSrc);
        setFormData(prev => ({ ...prev, photographUrl: undefined }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.employeeType) {
      toast({ title: "Validation Error", description: "Employee type is required.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedData = await updateEmployee(
        employeeToEdit.id, 
        formData,
        newPhotographFile,
        employeeToEdit.photographUrl 
      );
      toast({ title: "Update Successful!", description: `${updatedData.fullName}'s details updated.` });
      onUpdateSuccess(updatedData);
    } catch (error) {
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const employeeTypes: EmployeeType[] = ["FACULTY", "STAFF"];


  const previewEmployeeData: EmployeeData = {
    ...employeeToEdit,
    ...formData,
    photographUrl: photographPreview || "https://placehold.co/80x100.png",
    id: employeeToEdit.id,
    registrationDate: employeeToEdit.registrationDate,
    employeeType: formData.employeeType || employeeToEdit.employeeType,
  };

  return (
    <div className="space-y-8">
      <Card className="mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <UserCog size={24} /> Edit Employee: {employeeToEdit.fullName} (ID No: {employeeToEdit.employeeId})
          </CardTitle>
          <CardDescription>Modify employee details below. Click "Save Changes" to update.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Details</h3>
                    <Separator />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} /></div>
                    <div><Label htmlFor="employeeId">ID No.</Label><Input id="employeeId" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="sevarthNo">SEVARTH No.</Label><Input id="sevarthNo" name="sevarthNo" value={formData.sevarthNo || ''} onChange={handleChange} /></div>
                    <div><Label htmlFor="mobileNumber">Mobile Number</Label><Input id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber || ''} onChange={handleChange}/></div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="designation">Designation</Label><Input id="designation" name="designation" value={formData.designation || ''} onChange={handleChange} /></div>
                </div>  
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="employeeType">Employee Type</Label>
                      <Select value={formData.employeeType || ''} onValueChange={(value) => handleSelectChange('employeeType', value)} required>
                        <SelectTrigger><SelectValue placeholder="Select employee type" /></SelectTrigger>
                        <SelectContent>
                          {employeeTypes.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select value={formData.bloodGroup || 'NO_GROUP'} onValueChange={(value) => handleSelectChange('bloodGroup', value === 'NO_GROUP' ? '' : value)}>
                          <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                          <SelectContent>{bloodGroups.map((group) => <SelectItem key={group} value={group}><Droplets size={14} className="inline mr-2 text-red-500"/>{group}</SelectItem>)}<SelectItem value="NO_GROUP">None</SelectItem></SelectContent>
                      </Select>
                  </div>
                </div>
                <div className="space-y-2">
                    <Label>Photograph</Label>
                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant={inputMode === 'upload' ? 'secondary' : 'outline'} onClick={() => setInputMode('upload')}><UploadCloud className="mr-1 h-3 w-3" /> Upload</Button>
                        <Button type="button" size="sm" variant={inputMode === 'webcam' ? 'secondary' : 'outline'} onClick={() => setInputMode('webcam')}><Camera className="mr-1 h-3 w-3" /> Webcam</Button>
                        {(photographPreview && photographPreview !== "https://placehold.co/80x100.png") && <Button type="button" size="sm" variant="destructive" onClick={removePhoto}><Trash2 className="mr-1 h-3 w-3" /> Remove</Button>}
                    </div>
                    {inputMode === 'upload' && <Input id="photographFile" type="file" accept="image/*" onChange={handleNewPhotoChange} />}
                    {inputMode === 'webcam' && <div className="space-y-1"><Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-md border" /><Button type="button" onClick={capturePhoto} className="w-full h-8 text-xs" variant="outline"><Camera className="mr-1 h-3 w-3" /> Capture</Button></div>}
                </div>
                <div><Label htmlFor="address">Address</Label><Textarea id="address" name="address" value={formData.address || ''} onChange={handleChange}/></div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isOrganDonor" 
                    name="isOrganDonor"
                    checked={formData.isOrganDonor || false} 
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOrganDonor: !!checked }))}
                  />
                  <label
                    htmlFor="isOrganDonor"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Is an Organ Donor
                  </label>
                </div>
               
                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" className="bg-accent" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save Changes</Button>
                </div>
            </form>
            <div className="space-y-2 sticky top-8">
                <h3 className="text-lg font-semibold text-center">Live ID Card Preview</h3>
                {isLoadingSettings ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div> : <div className="flex flex-col items-center gap-2"><EmployeeIdCard employee={previewEmployeeData} settings={cardSettings} showFlipButton={false} initialSide="front" /></div>}
                 {photographPreview && <div className="mt-2 text-center"><p className="text-xs text-muted-foreground mb-1">Current Photograph:</p><Image src={photographPreview} alt="Photograph preview" width={80} height={100} className="rounded-md border object-cover inline-block" data-ai-hint="employee portrait" unoptimized/></div>}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
