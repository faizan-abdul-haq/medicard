
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MediCard';

export default function LoginPage() {
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/'); 
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      // AuthContext login handles redirection on success
    } catch (error) {
      // Error is already toasted by AuthContext, but can add more specific UI feedback here if needed
      console.error("Login page caught error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading or redirect if already authenticated or initial auth check is in progress
  if (isLoading || (!isLoading && isAuthenticated)) {
      return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <LogIn size={28}/> {appName} Admin Login
          </CardTitle>
          <CardDescription>Enter your credentials to access the {appName} dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Username)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
