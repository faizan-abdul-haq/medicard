'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, User, Briefcase } from "lucide-react";
import ProtectedRoute from '@/components/ProtectedRoute';

function BulkUploadHub() {
  const uploadOptions = [
    {
      title: 'Bulk Upload Students',
      description: 'Upload a CSV to register multiple students at once.',
      href: '/students/bulk-upload',
      icon: <User className="h-8 w-8 text-blue-500" />
    },
    {
      title: 'Bulk Upload Employees',
      description: 'Upload a CSV to register multiple faculty or staff members.',
      href: '/employees/bulk-upload',
      icon: <Briefcase className="h-8 w-8 text-purple-500" />
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Bulk Upload Hub</CardTitle>
          <CardDescription>Select which type of record you would like to bulk upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadOptions.map((option) => (
            <Link key={option.href} href={option.href} passHref>
              <div className="block border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-full">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BulkUploadPage() {
    return (
        <ProtectedRoute>
            <BulkUploadHub />
        </ProtectedRoute>
    )
}
