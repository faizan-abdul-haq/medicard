
'use client';

import Link from 'next/link';
import { Stethoscope, Users, UserPlus, UploadCloud, LogIn, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();

  // Don't render header on login page, or while auth state is loading
  if (pathname === '/login' || isLoading) {
    return null;
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Stethoscope size={28} />
          <span>MediCard</span>
        </Link>
        <nav>
          {isAuthenticated ? (
            <ul className="flex space-x-1 md:space-x-2 items-center">
              <li>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <Link href="/" className="flex items-center gap-1"><LayoutDashboard size={18}/>Dashboard</Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <Link href="/register"  className="flex items-center gap-1">
                  <UserPlus size={18} /> Register
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <Link href="/students/list" className="flex items-center gap-1">
                    <Users size={18} /> Students
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <Link href="/students/bulk-upload" className="flex items-center gap-1">
                    <UploadCloud size={18} /> Bulk Upload
                  </Link>
                </Button>
              </li>
               <li>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <Link href="/card-settings" className="flex items-center gap-1">
                    <Settings size={18} /> Card Settings
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" onClick={logout} className="text-primary-foreground hover:bg-red-500 hover:text-white transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                  <LogOut size={18} className="mr-1" /> Logout
                </Button>
              </li>
            </ul>
          ) : (
             <Button variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors">
                <Link href="/login" className="flex items-center gap-1">
                  <LogIn size={18} /> Login
                </Link>
              </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
