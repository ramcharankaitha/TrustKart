import { redirect } from 'next/navigation';

export default function RootPage() {
  // Check if user is logged in, if not, redirect to login
  // For this demo, we'll assume not logged in and redirect.
  // In a real app, you'd have session management.
  redirect('/login');
}
