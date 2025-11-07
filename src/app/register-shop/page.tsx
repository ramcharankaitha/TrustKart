'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, ArrowRight, AlertCircle } from 'lucide-react';

export default function ShopRegistrationRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to the main shopkeeper registration page
    router.push('/shopkeeper-registration');
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Redirecting...</h1>
          <p className="text-muted-foreground">
            Taking you to the shop registration page
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are being redirected to the main shop registration page.
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Link href="/shopkeeper-registration">
                <Button className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Go to Shop Registration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
