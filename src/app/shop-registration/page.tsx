'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ShopRegistrationPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to the main shopkeeper registration page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/shopkeeper-registration');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Shop Registration</h1>
          <p className="text-muted-foreground">
            Choose your preferred registration method
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Registration Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You will be automatically redirected to the main registration page in 3 seconds.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/shopkeeper-registration">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <Store className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">Main Registration</div>
                    <div className="text-sm opacity-80">Complete shop registration</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/registration">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">Enhanced Registration</div>
                    <div className="text-sm opacity-80">Alternative registration form</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Available Routes:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>/shopkeeper-registration</code> - Main shopkeeper registration</li>
                <li>• <code>/registration</code> - Enhanced registration form</li>
                <li>• <code>/create-shop</code> - Demo/test shop creation</li>
                <li>• <code>/test-shop-registration</code> - Test registration page</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login">
            <Button variant="outline">
              ← Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
