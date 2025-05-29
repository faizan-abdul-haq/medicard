import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, QrCode, ShieldCheck } from "lucide-react";
import Image from "next/image";

// In a real app, you would fetch student data based on the ID
// For now, we'll simulate this.
async function getStudentData(id: string) {
  // Simulate fetching data
  return {
    id,
    fullName: "Demo Student " + id.substring(0,4),
    prnNumber: id,
    courseName: "Computer Science (Demo)",
    photographUrl: "https://placehold.co/100x120.png",
    registrationDate: new Date(),
  };
}

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = await getStudentData(params.id);

  if (!student) {
    return <p>Student not found.</p>;
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <User size={24} /> Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={student.photographUrl} alt={student.fullName} data-ai-hint="student portrait" />
              <AvatarFallback>{student.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-primary">{student.fullName}</h2>
              <p className="text-muted-foreground">{student.courseName}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p><strong>PRN Number:</strong> {student.prnNumber}</p>
            <p><strong>Registration Date:</strong> {new Date(student.registrationDate).toLocaleDateString()}</p>
          </div>

          <div className="mt-6 p-4 bg-accent/10 rounded-md text-center">
            <QrCode className="mx-auto mb-2 text-accent" size={32} />
            <p className="text-sm text-accent-foreground">This profile was accessed via QR Code.</p>
            <p className="text-xs text-muted-foreground">Student ID: {student.id}</p>
          </div>
          <div className="flex items-center justify-center mt-4 text-green-600">
            <ShieldCheck size={20} className="mr-2"/>
            <p className="font-semibold">Verified Student Record</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
