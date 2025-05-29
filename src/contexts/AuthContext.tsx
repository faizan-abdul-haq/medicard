
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, pass: string) => Promise<void>; // Simulate async
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();

  useEffect(() => {
    // Check localStorage on initial load
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    setIsLoading(false); // Finished loading auth state
  }, []);

  const login = useCallback(async (username: string, pass: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, you'd validate credentials here
    console.log("Attempting login with:", username, pass); // For debugging
    setIsAuthenticated(true);
    try {
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
