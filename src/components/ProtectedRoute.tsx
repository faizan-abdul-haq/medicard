
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading authentication...</p></div>;
  }

  if (!isAuthenticated && pathname !== '/login') {
    // This case should ideally be caught by useEffect, but as a fallback:
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }
  
  // If authenticated or on the login page itself (which doesn't need this wrapper but good practice)
  return <>{children}</>;
}
