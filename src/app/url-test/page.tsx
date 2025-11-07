'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Store,
  Database,
  Settings
} from 'lucide-react';

export default function URLTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  const testURLs = async () => {
    setIsTesting(true);
    const results: any = {};

    const urls = [
      { name: 'Shopkeeper Registration', url: '/shopkeeper-registration' },
      { name: 'Shop Registration', url: '/shop-registration' },
      { name: 'Register Shop', url: '/register-shop' },
      { name: 'New Shop', url: '/new-shop' },
      { name: 'System Diagnostics', url: '/system-diagnostics' },
      { name: 'Database Setup', url: '/database-setup-complete' },
      { name: 'Login Page', url: '/login' }
    ];

    for (const urlTest of urls) {
      try {
        const response = await fetch(urlTest.url, { method: 'HEAD' });
        results[urlTest.name] = {
          status: response.ok ? 'Working' : 'Error',
          statusCode: response.status,
          url: urlTest.url
        };
      } catch (error) {
        results[urlTest.name] = {
          status: 'Error',
          error: error instanceof Error ? error.message : 'Unknown error',
          url: urlTest.url
        };
      }
    }

    setTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    testURLs();
  }, []);

  const getStatusBadge = (result: any) => {
    if (result.status === 'Working') {
      return <Badge variant="default" className="bg-green-500">✓ Working</Badge>;
    } else {
      return <Badge variant="destructive">✗ Error</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">URL Test Results</h1>
          <p className="text-muted-foreground">
            Testing all shopkeeper registration routes
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Server Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Server Port:</span>
                <Badge variant="outline">9002</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Status:</span>
                <Badge variant="default" className="bg-green-500">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Route Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(testResults).map(([name, result]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{name}</span>
                    <code className="text-sm text-muted-foreground">{result.url}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result)}
                    {result.statusCode && (
                      <Badge variant="outline">{result.statusCode}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Working URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Primary Shopkeeper Registration URL:</strong>
                  <br />
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    http://localhost:9002/shopkeeper-registration
                  </code>
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alternative URLs (Auto-redirect):</strong>
                  <br />
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    http://localhost:9002/shop-registration
                  </code>
                  <br />
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    http://localhost:9002/register-shop
                  </code>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/shopkeeper-registration">
                <Button className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Main Registration
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/system-diagnostics">
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  System Diagnostics
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                onClick={testURLs}
                disabled={isTesting}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Re-test URLs'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
