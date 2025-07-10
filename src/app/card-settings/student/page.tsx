
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import StudentIdCard from '@/components/StudentIdCard';
import ImageUploadField from '@/components/ImageUploadField';
import type { CardSettingsData, StudentData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { getCardSettings, saveCardSettings } from '@/services/cardSettingsService';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save, SettingsIcon, Palette, FileText, Clock, Image as ImageIcon, ArrowLeft, Type, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockStudentForPreview: StudentData = {
  id: 'PREVIEW_ID',
  fullName: 'Dr. A. P. J. Abdul Kalam',
  address: '123 Science Lane, Innovation City, Tech State 54321',
  dateOfBirth: new Date('1931-10-15'),
  mobileNumber: '9876543210',
  prnNumber: 'PRN000',
  rollNumber: 'R000',
  yearOfJoining: 'FIRST',
  courseName: 'MBBS',
  photographUrl: 'https://placehold.co/80x100.png',
  registrationDate: new Date(),
  bloodGroup: 'O+',
  cardHolderSignature: ''
};

const popularFonts = [
  "Arial, sans-serif",
  "'Arial Black', sans-serif",
  "'Courier New', monospace",
  "Georgia, serif",
  "'Helvetica Neue', sans-serif",
  "Impact, sans-serif",
  "'Lucida Console', monospace",
  "'Lucida Sans Unicode', sans-serif",
  "'Palatino Linotype', serif",
  "Tahoma, sans-serif",
  "'Times New Roman', serif",
  "'Trebuchet MS', sans-serif",
  "Verdana, sans-serif",
];

function CardSettingsContent() {
  const [settings, setSettings] = useState<CardSettingsData>(DEFAULT_CARD_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getCardSettings('student');
        setSettings(fetchedSettings);
      } catch (error) {
        toast({ title: "Error Loading Settings", description: "Failed to fetch student card settings. Using defaults.", variant: "destructive" });
        setSettings(DEFAULT_CARD_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveCardSettings(settings, 'student');
      toast({ title: "Settings Saved", description: "Student card settings have been updated." });
    } catch (error) {
      toast({ title: "Error Saving Settings", description: "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleResetToDefaults = () => {
    setSettings(DEFAULT_CARD_SETTINGS);
    toast({ title: "Settings Reset", description: "Form has been reset to default values. Click 'Save Settings' to persist."});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading Student Card Settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <User size={32} /> Student Card Customization
          </CardTitle>
          <CardDescription>
            Customize the appearance and content of the student ID cards. Changes will apply to all student cards. Card size: 54mm x 86mm.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Palette /> Colors</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label htmlFor="headerBackgroundColor">Header Background Color</Label><Input name="headerBackgroundColor" value={settings.headerBackgroundColor} onChange={handleInputChange} /></div>
                <div><Label htmlFor="headerTextColor">Header Text Color</Label><Input name="headerTextColor" value={settings.headerTextColor} onChange={handleInputChange} /></div>
                <div><Label htmlFor="importantInfoBackgroundColor">Important Info Background Color</Label><Input name="importantInfoBackgroundColor" value={settings.importantInfoBackgroundColor} onChange={handleInputChange} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Type /> Font & Size</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="cardFontFamily">Font Family</Label>
                  <Select value={settings.cardFontFamily} onValueChange={(value) => handleSelectChange('cardFontFamily', value)}>
                    <SelectTrigger id="cardFontFamily"><SelectValue placeholder="Select font family" /></SelectTrigger>
                    <SelectContent>{popularFonts.map(font => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font.split(',')[0].replace(/'/g, '')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="cardFontSize">Header Font Size (in px)</Label><Input type="number" name="cardFontSize" value={settings.cardFontSize} onChange={handleNumberInputChange} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><FileText /> Header & Footer Text</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label htmlFor="collegeNameLine1">College Name Line 1</Label><Input name="collegeNameLine1" value={settings.collegeNameLine1} onChange={handleInputChange} /></div>
                <div><Label htmlFor="collegeNameLine2">College Name Line 2</Label><Input name="collegeNameLine2" value={settings.collegeNameLine2} onChange={handleInputChange} /></div>
                <div><Label htmlFor="deanTitle">Dean's Title</Label><Input name="deanTitle" value={settings.deanTitle} onChange={handleInputChange} /></div>
                 <div><Label htmlFor="defaultCardHolderSignatureText">Card Holder Signature Text</Label><Input name="defaultCardHolderSignatureText" value={settings.defaultCardHolderSignatureText} onChange={handleInputChange} /></div>
                <div><Label htmlFor="officePhoneNumber">Office Phone Number</Label><Input name="officePhoneNumber" value={settings.officePhoneNumber} onChange={handleInputChange} /></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><ImageIcon /> Logo & Signature</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <ImageUploadField label="College Logo" value={settings.logoUrl} onChange={(url) => setSettings(prev => ({ ...prev, logoUrl: url }))} directory="card_logo" maxSizeKB={1024} />
                  <Separator />
                  <ImageUploadField label="Dean Signature Upload" value={settings.deanSignatureUrl} onChange={(url) => setSettings(prev => ({ ...prev, deanSignatureUrl: url }))} directory="signatures" maxSizeKB={1024} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Clock /> Validity</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label htmlFor="validityPeriodMonths">Card Validity Period (in months)</Label><Input type="number" name="validityPeriodMonths" value={settings.validityPeriodMonths} onChange={handleNumberInputChange} /></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><FileText /> Instructions (Back of Card)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label htmlFor="instructionLine1">Instruction Line 1</Label><Textarea name="instructionLine1" value={settings.instructionLine1} onChange={handleInputChange} rows={2}/></div>
                 <div><Label htmlFor="instructionLine2">Instruction Line 2</Label><Textarea name="instructionLine2" value={settings.instructionLine2} onChange={handleInputChange} rows={2}/></div>
                 <div><Label htmlFor="instructionLine3">Instruction Line 3</Label><Textarea name="instructionLine3" value={settings.instructionLine3} onChange={handleInputChange} rows={2}/></div>
                 <div><Label htmlFor="instructionLine4">Instruction Line 4</Label><Textarea name="instructionLine4" value={settings.instructionLine4} onChange={handleInputChange} rows={2}/></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sticky top-8">
            <h3 className="text-xl font-semibold text-center text-foreground">Live ID Card Preview</h3>
            <Separator/>
            <p className="text-sm text-muted-foreground text-center">Front Side:</p>
            <StudentIdCard student={mockStudentForPreview} settings={settings} showFlipButton={false} initialSide="front" />
            <Separator className="my-4"/>
            <p className="text-sm text-muted-foreground text-center">Back Side:</p>
            <StudentIdCard student={mockStudentForPreview} settings={settings} showFlipButton={false} initialSide="back" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center py-4 border-t">
           <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefaults} disabled={isSaving}>Reset to Defaults</Button>
            <Button onClick={handleSaveSettings} disabled={isSaving || isLoading} className="bg-accent hover:bg-accent/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function StudentCardSettingsPage() {
    return (
        <ProtectedRoute>
            <CardSettingsContent />
        </ProtectedRoute>
    )
}
