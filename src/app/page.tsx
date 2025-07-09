
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpenText, BadgeCheck, CalendarClock, ListChecks, UploadCloud, UserPlus, Link2, Settings as SettingsIcon, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RecentRegistration, StudentData, CardSettingsData, EmployeeData, RecentEmployeeRegistration } from "@/lib/types";
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { format, addMonths, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudents } from "@/services/studentService";
import { getEmployees } from "@/services/employeeService";
import { getCardSettings } from '@/services/cardSettingsService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MediCard';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  colorClass?: string;
  href: string;
}

function StatCard({ title, value, description, icon, colorClass = "text-primary", href }: StatCardProps) {
  return (
    <Link href={href} passHref>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <span className={colorClass}>{icon}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<Omit<StatCardProps, 'href'>[]>([]);
  const [recentStudentRegistrations, setRecentStudentRegistrations] = useState<RecentRegistration[]>([]);
  const [recentEmployeeRegistrations, setRecentEmployeeRegistrations] = useState<RecentEmployeeRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [students, employees, settings] = await Promise.all([
          getStudents(),
          getEmployees(),
          getCardSettings()
        ]);

        // Student Stats
        const now = new Date();
        const nextMonthStart = startOfMonth(addMonths(now, 1));
        const nextMonthEnd = endOfMonth(addMonths(now, 1));
        let activeCount = 0;
        let expiringCount = 0;
        const uniqueCourses = new Set<string>();

        students.forEach(student => {
          const expiryDate = addMonths(new Date(student.registrationDate), settings.validityPeriodMonths);
          if (isBefore(now, expiryDate)) activeCount++;
          if (isBefore(expiryDate, nextMonthEnd) && isBefore(nextMonthStart, expiryDate)) expiringCount++;
          if (student.courseName) uniqueCourses.add(student.courseName);
        });
        
        const sortedStudents = students
          .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
          .slice(0, 3)
          .map(s => ({
            name: s.fullName,
            date: format(new Date(s.registrationDate), 'dd MMM, yyyy'),
            profileLink: `/students/${s.id}`,
            photographUrl: s.photographUrl
          }));
        setRecentStudentRegistrations(sortedStudents);
        
        // Employee Stats
         const sortedEmployees = employees
          .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
          .slice(0, 3)
          .map(e => ({
            name: e.fullName,
            date: format(new Date(e.registrationDate), 'dd MMM, yyyy'),
            profileLink: `/employees/${e.id}`,
            photographUrl: e.photographUrl
          }));
        setRecentEmployeeRegistrations(sortedEmployees);

        setStats([
          { title: "Total Students", value: students.length.toString(), description: "Currently in system", icon: <Users className="h-5 w-5" />, colorClass: "text-blue-500" },
          { title: "Active ID Cards", value: activeCount.toString(), description: `${settings.validityPeriodMonths}-month validity`, icon: <BadgeCheck className="h-5 w-5" />, colorClass: "text-green-600" },
          { title: "Expiring Next Month", value: expiringCount.toString(), description: "Student cards expiring", icon: <CalendarClock className="h-5 w-5" />, colorClass: "text-orange-500" },
          { title: "Total Employees", value: employees.length.toString(), description: "Currently in system", icon: <Briefcase className="h-5 w-5" />, colorClass: "text-indigo-500" },
        ]);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({ title: "Error Fetching Data", description: "Could not load dashboard statistics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  
  const statLinks = {
    "Total Students": "/students/list?filter=all",
    "Active ID Cards": "/students/list?filter=active",
    "Expiring Next Month": "/students/list?filter=expiring",
    "Total Employees": "/employees/list"
  };

  const QuickAction = ({ href, icon, label, variant = "outline" }: { href: string, icon: React.ReactNode, label: string, variant?: "default" | "outline" | "secondary" | "accent" }) => (
    <Link href={href} passHref>
      <Button size="lg" variant={variant as any} className={`w-full py-6 text-base ${variant === 'accent' ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}>
        {icon} {label}
      </Button>
    </Link>
  );

  const ActivityList = ({ title, description, items }: { title: string, description: string, items: (RecentRegistration[] | RecentEmployeeRegistration[]) }) => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p>Loading activity...</p> : items.length > 0 ? (
          <ul className="space-y-4">
            {items.map((reg, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                     <AvatarImage src={reg.photographUrl || 'https://placehold.co/40x40.png'} alt={reg.name} data-ai-hint="person avatar" />
                     <AvatarFallback>{reg.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{reg.name}</p>
                    <p className="text-xs text-muted-foreground">Registered on: {reg.date}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  <Link href={reg.profileLink}><Link2 size={14} className="mr-1" />Profile</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No recent activity to display.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{appName} Dashboard</h1>
        <p className="text-muted-foreground">Overview of registrations and ID card status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array(4).fill(0).map((_, i) => <Card key={i} className="h-[120px] animate-pulse bg-muted/50"></Card>) :
          stats.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              href={statLinks[stat.title as keyof typeof statLinks] || '/'}
            />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center mt-10">
        <QuickAction href="/register" icon={<UserPlus className="mr-2" />} label="Register Student" variant="accent" />
        <QuickAction href="/students/list" icon={<ListChecks className="mr-2" />} label="Student Roster" />
        <QuickAction href="/employees/register" icon={<Briefcase className="mr-2" />} label="Register Employee" variant="secondary"/>
        <QuickAction href="/employees/list" icon={<ListChecks className="mr-2" />} label="Employee Roster" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <ActivityList title="Recent Student Activity" description="Latest student registrations." items={recentStudentRegistrations} />
        <ActivityList title="Recent Employee Activity" description="Latest employee registrations." items={recentEmployeeRegistrations} />
      </div>

      <Separator className="my-6"/>

      <Card className="text-center">
        <CardHeader>
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-4">
           <QuickAction href="/students/bulk-upload" icon={<UploadCloud className="mr-2" />} label="Bulk Upload Students" />
           <QuickAction href="/card-settings" icon={<SettingsIcon className="mr-2" />} label="Card Settings" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { isLoading: authIsLoading } = useAuth();
  
  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading dashboard...</p></div>;
  }

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
