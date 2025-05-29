
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  type User 
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      if (user && pathname === '/login') {
        router.push('/'); // Redirect if logged in and on login page
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router, pathname]);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting currentUser and redirecting
      router.push('/'); 
    } catch (error: any) {
      console.error("Firebase login failed:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: errorMessage,
      });
      setIsLoading(false); // Ensure loading is false on error
      throw error; // Re-throw to be caught by login page if needed
    }
    // setIsLoading(false) will be handled by onAuthStateChanged implicitly
  }, [router, toast]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout failed:", error);
      toast({
        variant: 'destructive',
        title: 'Logout Error',
        description: "Could not log out. Please try again.",
      });
    } finally {
        // setIsLoading(false) // onAuthStateChanged handles this
    }
  }, [router, toast]);
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, isLoading }}>
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
