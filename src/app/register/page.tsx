
'use client';

import StudentRegistrationForm from '@/components/StudentRegistrationForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading registration form...</p></div>;
  }

  return (
    <ProtectedRoute>
      <div>
        <StudentRegistrationForm />
      </div>
    </ProtectedRoute>
  );
}
