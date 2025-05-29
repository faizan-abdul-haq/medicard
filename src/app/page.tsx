import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpenText, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function DashboardPage() {
  // Mock data for dashboard
  const stats = [
    {
      title: "Total Students Registered",
      value: "1,234",
      description: "+20% from last month",
      icon: <Users className="h-5 w-5" />,
      colorClass: "text-primary",
    },
    {
      title: "Courses Offered",
      value: "15",
      description: "Across various departments",
      icon: <BookOpenText className="h-5 w-5" />,
      colorClass: "text-accent",
    },
    {
      title: "Active ID Cards",
      value: "1,150",
      description: "Valid and in circulation",
      icon: <BadgeCheck className="h-5 w-5" />,
      colorClass: "text-green-600",
    },
     {
      title: "Expiring Soon",
      value: "78",
      description: "Cards expiring next month",
      icon: <Users className="h-5 w-5" />, // Example icon, can be changed
      colorClass: "text-orange-500",
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

      <div className="text-center mt-12">
        <Link href="/register">
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Register New Student
          </Button>
        </Link>
      </div>

      <Card className="mt-10 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Placeholder for recent registrations or ID card events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display yet.</p>
          {/* This area can be populated with a list or table of recent events in a future update. */}
        </CardContent>
      </Card>

    </div>
  );
}
