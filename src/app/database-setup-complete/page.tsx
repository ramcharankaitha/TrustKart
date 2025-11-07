'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';

export default function DatabaseSetupPage() {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResults, setSetupResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const setupDatabase = async () => {
    setIsSettingUp(true);
    setError(null);
    
    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setSetupResults(result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Database setup failed');
      }
    } catch (error) {
      console.error('Database setup error:', error);
      setError(error instanceof Error ? error.message : 'Database setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-database');
      const result = await response.json();
      setSetupResults({ connection: result });
    } catch (error) {
      console.error('Connection test error:', error);
      setError('Connection test failed');
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Database Setup & Repair</h1>
          <p className="text-muted-foreground">
            Fix database connection issues and setup missing tables
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                  <span>Connection Status:</span>
                  <Badge variant={setupResults.connection?.prisma ? "default" : "destructive"}>
                    {setupResults.connection?.prisma ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase Status:</span>
                  <Badge variant={setupResults.connection?.supabase ? "default" : "destructive"}>
                    {setupResults.connection?.supabase ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={isSettingUp} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test Connection
                </Button>
                
                <Button onClick={setupDatabase} disabled={isSettingUp} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isSettingUp ? 'Setting up...' : 'Setup Database'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Setup Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(setupResults).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(setupResults).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-3 border rounded">
                      <div className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No setup results yet. Click "Setup Database" to begin.</p>
              )}
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
              <Button 
                onClick={() => window.location.href = '/shopkeeper-registration'}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Test Registration
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Database Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common Issues & Solutions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Database connection timeout - Check Supabase project status</li>
                    <li>Missing tables - Run database setup to create tables</li>
                    <li>Schema mismatch - Update Prisma schema and push changes</li>
                    <li>Authentication errors - Verify API keys in .env file</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Setup Steps:</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Click "Test Connection" to check database connectivity</li>
                  <li>2. Click "Setup Database" to create missing tables and columns</li>
                  <li>3. Test shopkeeper registration to verify everything works</li>
                  <li>4. If issues persist, check Supabase dashboard for project status</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
