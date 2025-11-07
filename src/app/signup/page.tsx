
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();

    const handleSignup = () => {
        // Mock signup logic
        // In a real app, you'd create the user and then log them in.
        localStorage.setItem('userRole', 'customer'); // Default to customer on signup
        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard');
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
       <div className="w-full max-w-md">
         <div className="text-center mb-6">
            <Link href="/" className="flex items-center justify-center gap-2 font-semibold font-headline text-2xl">
                <Leaf className="h-8 w-8 text-primary" />
                <span>TrustKart</span>
            </Link>
             <p className="text-muted-foreground mt-2 text-sm">Create your account</p>
        </div>
        <Card>
        <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
            Enter your information to get started.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Alex Green" />
            </div>
            <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
            </div>
        </CardContent>
        <CardContent>
            <Button className="w-full" onClick={handleSignup}>Create Account</Button>
             <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline font-medium text-primary">
                    Login
                </Link>
            </div>
            <div className="mt-2 text-center text-sm">
                Want to register as a customer?{' '}
                <Link href="/customer-registration" className="underline font-medium text-primary">
                    Customer Registration
                </Link>
            </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
