'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Wrench,
  Bug
} from 'lucide-react';

export default function SupabaseDebugPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const testSupabase = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      // Test basic connection
      const connectionResponse = await fetch('/api/test-supabase');
      const connectionResult = await connectionResponse.json();
      
      setTestResults(prev => ({
        ...prev,
        connection: connectionResult
      }));
      
      if (!connectionResponse.ok) {
        throw new Error(connectionResult.error || 'Connection test failed');
      }
      
      // Test user creation
      const userResponse = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const userResult = await userResponse.json();
      
      setTestResults(prev => ({
        ...prev,
        userCreation: userResult
      }));
      
    } catch (error) {
      console.error('Supabase test error:', error);
      setError(error instanceof Error ? error.message : 'Supabase test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const fixDatabase = async () => {
    try {
      const response = await fetch('/api/fix-database-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          schemaFix: result
        }));
      } else {
        throw new Error(result.error || 'Schema fix failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Schema fix failed');
    }
  };

  const getStatusBadge = (result: any) => {
    if (result?.success === true) {
      return <Badge variant="default" className="bg-green-500">✓ Working</Badge>;
    } else if (result?.success === false) {
      return <Badge variant="destructive">✗ Failed</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Supabase Database Debug</h1>
          <p className="text-muted-foreground">
            Debug the Supabase user creation error: {}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(testResults.connection)}
              </div>
              
              {testResults.connection?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Error:</strong> {testResults.connection.error}
                    {testResults.connection.code && (
                      <><br /><strong>Code:</strong> {testResults.connection.code}</>
                    )}
                    {testResults.connection.details && (
                      <><br /><strong>Details:</strong> {testResults.connection.details}</>
                    )}
                    {testResults.connection.hint && (
                      <><br /><strong>Hint:</strong> {testResults.connection.hint}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={testSupabase} 
                disabled={isTesting}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardContent>
          </Card>

          {/* User Creation Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                User Creation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(testResults.userCreation)}
              </div>
              
              {testResults.userCreation?.fullError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Full User Creation Failed:</strong>
                    <br />{testResults.userCreation.fullError.message}
                    {testResults.userCreation.fullError.code && (
                      <><br /><strong>Code:</strong> {testResults.userCreation.fullError.code}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.userCreation?.minimalError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Minimal User Creation Also Failed:</strong>
                    <br />{testResults.userCreation.minimalError.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.userCreation?.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {testResults.userCreation.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table Structure */}
        {testResults.connection?.tableStructure && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Users Table Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {testResults.connection.tableStructure.map((column: any, index: number) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="font-medium">{column.column_name}</div>
                    <div className="text-muted-foreground">{column.data_type}</div>
                    <div className="text-xs">
                      {column.is_nullable === 'YES' ? 'Nullable' : 'Required'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={testSupabase} 
                disabled={isTesting}
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug Supabase
              </Button>
              
              <Button 
                onClick={fixDatabase}
                variant="outline"
                className="w-full"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Fix Database Schema
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/shopkeeper-registration'}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Registration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

