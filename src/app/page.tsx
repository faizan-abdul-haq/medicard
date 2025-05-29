
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpenText, BadgeCheck, CalendarClock, ListChecks, UploadCloud, UserPlus, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RecentRegistration, StudentData } from "@/lib/types";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudents } from "@/services/studentService";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  colorClass?: string;
}

function StatCard({ title, value, description, icon, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className={colorClass}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const students = await getStudents();
        setTotalStudents(students.length);

        const sortedStudents = students
          .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
          .slice(0, 3)
          .map(s => ({
            name: s.fullName,
            date: format(new Date(s.registrationDate), 'dd MMM, yyyy'),
            profileLink: `/students/${s.prnNumber}`,
            photographUrl: s.photographUrl
          }));
        setRecentRegistrations(sortedStudents);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Potentially set an error state and show a message to the user
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const activeIDCards = Math.floor(totalStudents * 0.95); 
  const expiringSoon = Math.floor(totalStudents * 0.05);

  const stats = [
    {
      title: "Total Students Registered",
      value: isLoading ? "..." : totalStudents.toString(),
      description: `Currently in system`,
      icon: <Users className="h-5 w-5" />,
      colorClass: "text-primary",
    },
    {
      title: "Active ID Cards",
      value: isLoading ? "..." : activeIDCards.toString(),
      description: "Valid and in circulation",
      icon: <BadgeCheck className="h-5 w-5" />,
      colorClass: "text-green-600",
    },
    {
      title: "Expiring Soon",
      value: isLoading ? "..." : expiringSoon.toString(),
      description: "Cards expiring next month",
      icon: <CalendarClock className="h-5 w-5" />,
      colorClass: "text-orange-500",
    },
    {
      title: "Courses Offered",
      value: "15", // Placeholder, not from dynamic data yet
      description: "Across various departments",
      icon: <BookOpenText className="h-5 w-5" />,
      colorClass: "text-accent",
    },
  ];


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">MediCard Dashboard</h1>
        <p className="text-muted-foreground">Overview of student registrations and ID card status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            colorClass={stat.colorClass}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-10">
        <Link href="/register" legacyBehavior passHref>
          <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-base">
            <UserPlus className="mr-2" /> Register New Student
          </Button>
        </Link>
        <Link href="/students/list" legacyBehavior passHref>
           <Button size="lg" variant="outline" className="w-full py-6 text-base">
            <ListChecks className="mr-2" /> View Student Roster
          </Button>
        </Link>
        <Link href="/students/bulk-upload" legacyBehavior passHref>
          <Button size="lg" variant="outline" className="w-full py-6 text-base">
            <UploadCloud className="mr-2" /> Bulk Upload Students
          </Button>
        </Link>
      </div>

      <Card className="mt-10 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest student registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading recent activity...</p> : recentRegistrations.length > 0 ? (
            <ul className="space-y-4">
              {recentRegistrations.map((reg, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                       <AvatarImage src={reg.photographUrl || 'https://placehold.co/40x40.png'} alt={reg.name} data-ai-hint="student avatar" />
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
            <p className="text-muted-foreground">No recent activity to display yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function DashboardPage() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  
  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading dashboard...</p></div>;
  }

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
