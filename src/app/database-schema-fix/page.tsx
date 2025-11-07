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
  Settings, 
  Wrench,
  RefreshCw
} from 'lucide-react';

export default function DatabaseSchemaFix() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const fixDatabaseSchema = async () => {
    setIsFixing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-database-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setResults(result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Database schema fix failed');
      }
    } catch (error) {
      console.error('Database schema fix error:', error);
      setError(error instanceof Error ? error.message : 'Database schema fix failed');
    } finally {
      setIsFixing(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/fix-database-schema');
      const result = await response.json();
      setResults({ connection: result });
    } catch (error) {
      setError('Connection test failed');
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Database Schema Fix</h1>
          <p className="text-muted-foreground">
            Fix missing password, phone, and aadhaar_number columns
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Schema Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> Supabase user creation failed: {} - Password column not present in schema
              </AlertDescription>
            </Alert>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Missing Columns:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <code>password</code> - Required for user authentication</li>
                <li>• <code>phone</code> - Required for user contact information</li>
                <li>• <code>aadhaar_number</code> - Required for shopkeeper verification</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={fixDatabaseSchema} 
                disabled={isFixing}
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                {isFixing ? 'Fixing Schema...' : 'Fix Database Schema'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={testConnection}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6">
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

        {Object.keys(results).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Fix Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(results).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center gap-2">
                      {typeof value === 'string' && value.includes('Success') ? (
                        <Badge variant="default" className="bg-green-500">✓ Success</Badge>
                      ) : typeof value === 'string' && value.includes('Failed') ? (
                        <Badge variant="destructive">✗ Failed</Badge>
                      ) : (
                        <Badge variant="outline">{String(value)}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">After Fixing Schema:</h3>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Go back to shopkeeper registration</li>
                  <li>2. Try creating a new user account</li>
                  <li>3. The password column error should be resolved</li>
                  <li>4. All user fields should work properly</li>
                </ol>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  onClick={() => window.location.href = '/shopkeeper-registration'}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Test Registration
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/system-diagnostics'}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  System Diagnostics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

