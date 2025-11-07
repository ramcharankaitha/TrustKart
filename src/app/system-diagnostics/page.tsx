'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Home,
  Store,
  User,
  Wrench
} from 'lucide-react';

export default function SystemDiagnosticsPage() {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test database connections
      const dbResponse = await fetch('/api/test-database');
      const dbResult = await dbResponse.json();
      results.database = dbResult;

      // Test shopkeeper registration
      try {
        const regResponse = await fetch('/api/test-registration');
        const regResult = await regResponse.json();
        results.registration = regResult;
      } catch (regError) {
        results.registration = { error: 'Registration test failed' };
      }

      // Test authentication
      try {
        const authResponse = await fetch('/api/test-auth');
        const authResult = await authResponse.json();
        results.authentication = authResult;
      } catch (authError) {
        results.authentication = { error: 'Authentication test failed' };
      }

      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics error:', error);
      setError(error instanceof Error ? error.message : 'Diagnostics failed');
    } finally {
      setIsRunning(false);
    }
  };

  const fixDatabase = async () => {
    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Database Fixed",
          description: "Database setup completed successfully.",
        });
        runDiagnostics(); // Re-run diagnostics
      } else {
        throw new Error(result.error || 'Database setup failed');
      }
    } catch (error) {
      console.error('Database fix error:', error);
      setError(error instanceof Error ? error.message : 'Database fix failed');
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusBadge = (status: any) => {
    if (status === true || (status && status.success)) {
      return <Badge variant="default" className="bg-green-500">Working</Badge>;
    } else if (status === false || (status && status.error)) {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Comprehensive system health check and repair tools
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Prisma:</span>
                  {getStatusBadge(diagnostics.database?.results?.prisma)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase:</span>
                  {getStatusBadge(diagnostics.database?.results?.supabase)}
                </div>
              </div>

              {diagnostics.database?.results?.prismaError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {String(diagnostics.database.results.prismaError)}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={fixDatabase} 
                disabled={isRunning}
                className="w-full"
                size="sm"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Fix Database
              </Button>
            </CardContent>
          </Card>

          {/* Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Registration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Shop Registration:</span>
                  {getStatusBadge(diagnostics.registration?.success)}
                </div>
                <div className="flex items-center justify-between">
                  <span>User Creation:</span>
                  {getStatusBadge(diagnostics.registration?.userCreated)}
                </div>
              </div>

              {diagnostics.registration?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {diagnostics.registration.error}
                  </AlertDescription>
                </Alert>
              )}

              <Link href="/shopkeeper-registration">
                <Button className="w-full" size="sm">
                  <Store className="h-4 w-4 mr-2" />
                  Test Registration
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Login System:</span>
                  {getStatusBadge(diagnostics.authentication?.success)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Management:</span>
                  {getStatusBadge(diagnostics.authentication?.session)}
                </div>
              </div>

              {diagnostics.authentication?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {diagnostics.authentication.error}
                  </AlertDescription>
                </Alert>
              )}

              <Link href="/login">
                <Button className="w-full" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Test Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button 
                onClick={runDiagnostics} 
                disabled={isRunning}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Diagnostics'}
              </Button>
              
              <Link href="/database-setup-complete">
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Database Setup
                </Button>
              </Link>
              
              <Link href="/shopkeeper-registration">
                <Button variant="outline" className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Shop Registration
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        {Object.keys(diagnostics).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
