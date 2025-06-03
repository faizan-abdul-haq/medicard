
'use client';

import StudentRegistrationForm from '@/components/StudentRegistrationForm';
// ProtectedRoute is removed as this page is now public for students.
// Admin-specific actions within the form will be handled by checking auth state.

export default function RegisterPage() {
  // authIsLoading check removed as it was part of ProtectedRoute logic.
  // The form itself can handle its internal loading states if necessary,
  // and auth state for conditional UI within the form is fetched by StudentRegistrationForm.
  return (
    <div>
      <StudentRegistrationForm />
    </div>
  );
}
