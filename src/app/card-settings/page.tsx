
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, Briefcase, Users } from "lucide-react";
import ProtectedRoute from '@/components/ProtectedRoute';

function CardSettingsHub() {
  const settingsOptions = [
    {
      title: 'Student Card Settings',
      description: 'Customize the design and content for all student ID cards.',
      href: '/card-settings/student',
      icon: <User className="h-8 w-8 text-blue-500" />
    },
    {
      title: 'Faculty Card Settings',
      description: 'Set the appearance and details for faculty member ID cards.',
      href: '/card-settings/faculty',
      icon: <Briefcase className="h-8 w-8 text-purple-500" />
    },
    {
      title: 'Staff Card Settings',
      description: 'Define the layout and information for staff ID cards.',
      href: '/card-settings/staff',
      icon: <Users className="h-8 w-8 text-green-500" />
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Card Customization Hub</CardTitle>
          <CardDescription>Select which type of ID card you would like to customize.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsOptions.map((option) => (
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

export default function CardSettingsPage() {
    return (
        <ProtectedRoute>
            <CardSettingsHub />
        </ProtectedRoute>
    )
}
