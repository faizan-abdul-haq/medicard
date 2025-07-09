
'use client';

import Link from 'next/link';
import { Stethoscope, Users, UserPlus, UploadCloud, LogIn, LogOut, LayoutDashboard, Settings, Menu, X, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MediCard';

export default function Header() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Don't render header on login page, during auth loading, or for unauthenticated users on register page
  if (pathname === '/login' || isLoading || (!isAuthenticated && pathname === '/register')) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-primary text-primary-foreground shadow-md print:hidden w-full">
      <div className="container mx-auto px-2 sm:px-4 py-2 flex justify-between items-center max-w-full">
        <Link href="/" className="flex items-center gap-1 text-base sm:text-lg font-bold shrink-0" onClick={closeMenu}>
          <Stethoscope size={20} className="sm:h-6 sm:w-6" />
          <span>{appName}</span>
        </Link>
        <nav className="flex items-center">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                className="lg:hidden p-1 text-primary-foreground hover:bg-primary/80"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <div
                className={`${
                  isMenuOpen ? 'block' : 'hidden'
                } lg:block absolute lg:static top-12 left-0 right-0 bg-primary z-20 lg:z-auto w-full lg:w-auto px-2 sm:px-4 pb-4 lg:pb-0 shadow-md lg:shadow-none`}
              >
                <ul className="flex flex-col lg:flex-row space-y-1 lg:space-y-0 lg:space-x-1">
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/" className="flex items-center gap-1" onClick={closeMenu}>
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/register" className="flex items-center gap-1" onClick={closeMenu}>
                        <UserPlus size={14} /> Register Student
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/students/list" className="flex items-center gap-1" onClick={closeMenu}>
                        <Users size={14} /> Students
                      </Link>
                    </Button>
                  </li>
                   <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/employees/register" className="flex items-center gap-1" onClick={closeMenu}>
                        <Briefcase size={14} /> Register Employee
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/employees/list" className="flex items-center gap-1" onClick={closeMenu}>
                        <Users size={14} /> Employees
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/bulk-upload" className="flex items-center gap-1" onClick={closeMenu}>
                        <UploadCloud size={14} /> Bulk Upload
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" asChild className="w-full lg:w-auto justify-start lg:justify-center">
                      <Link href="/card-settings" className="flex items-center gap-1" onClick={closeMenu}>
                        <Settings size={14} /> Card Settings
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" onClick={() => { logout(); closeMenu(); }} className="w-full lg:w-auto justify-start lg:justify-center hover:bg-red-500 hover:text-white">
                      <LogOut size={14} className="mr-1" /> Logout
                    </Button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <Button variant="outline" asChild className="text-primary-foreground border-primary-foreground hover:bg-primary/80 hover:text-accent-foreground">
              <Link href="/login" className="flex items-center gap-1">
                <LogIn size={14} /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
