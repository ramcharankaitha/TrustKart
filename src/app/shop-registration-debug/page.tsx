'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Store, ArrowRight, CheckCircle, AlertCircle, ExternalLink, Home } from 'lucide-react';

export default function ShopRegistrationDebug() {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');
  const [availableRoutes, setAvailableRoutes] = useState([
    '/shopkeeper-registration',
    '/registration', 
    '/create-shop',
    '/test-shop-registration',
    '/shop-registration',
    '/register-shop',
    '/new-shop'
  ]);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const testRoute = async (route: string) => {
    try {
      const response = await fetch(route);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Shop Registration Debug</h1>
          <p className="text-muted-foreground">
            Debugging tool for shop registration routes
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Current URL:</strong>
                <code className="block mt-1 p-2 bg-muted rounded text-sm break-all">
                  {currentUrl}
                </code>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  If you're seeing a 404 error, try one of the working routes below.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Available Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Available Routes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{route}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {route === '/shopkeeper-registration' && 'Main registration'}
                      {route === '/registration' && 'Enhanced registration'}
                      {route === '/create-shop' && 'Demo/test page'}
                      {route === '/test-shop-registration' && 'Test page'}
                      {route === '/shop-registration' && 'Redirect page'}
                      {route === '/register-shop' && 'Redirect page'}
                      {route === '/new-shop' && 'Redirect page'}
                    </span>
                  </div>
                  <Link href={route}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/shopkeeper-registration">
                <Button className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Main Registration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.reload()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Fix 404 Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common causes of 404 errors:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Incorrect URL path (typos in the URL)</li>
                    <li>Missing page.tsx file in the route directory</li>
                    <li>Server not running or running on wrong port</li>
                    <li>Next.js build issues</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Solution Steps:</h3>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Make sure the development server is running on port 9002</li>
                  <li>2. Use the correct URL: <code>http://localhost:9002/shopkeeper-registration</code></li>
                  <li>3. Try the main registration route first</li>
                  <li>4. If still getting 404, try the alternative routes above</li>
                  <li>5. Check browser console for any JavaScript errors</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
