'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';

export default function DatabaseDebugPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runDatabaseTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Test User Creation (Basic Fields)',
        test: async () => {
          const testData = {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            role: 'shopkeeper',
            password: 'test123'
          };
          
          const result = await LoginDatabasePlugin.createUserAccount(testData);
          return {
            success: result.success,
            message: result.success ? 'User created successfully' : result.error,
            data: result
          };
        }
      },
      {
        name: 'Test User Creation (With Phone)',
        test: async () => {
          const testData = {
            email: `test-phone-${Date.now()}@example.com`,
            name: 'Test User Phone',
            role: 'shopkeeper',
            password: 'test123',
            phone: '+1234567890'
          };
          
          const result = await LoginDatabasePlugin.createUserAccount(testData);
          return {
            success: result.success,
            message: result.success ? 'User with phone created successfully' : result.error,
            data: result
          };
        }
      },
      {
        name: 'Test User Creation (With All Fields)',
        test: async () => {
          const testData = {
            email: `test-all-${Date.now()}@example.com`,
            name: 'Test User All',
            role: 'shopkeeper',
            password: 'test123',
            phone: '+1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'male'
          };
          
          const result = await LoginDatabasePlugin.createUserAccount(testData);
          return {
            success: result.success,
            message: result.success ? 'User with all fields created successfully' : result.error,
            data: result
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          ...result
        });
      } catch (error: any) {
        results.push({
          name: test.name,
          success: false,
          message: error.message || 'Test failed',
          data: error
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection & Schema Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex gap-4">
            <Button 
              onClick={runDatabaseTests} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Run Database Tests
                </>
              )}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{result.name}</h4>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pass
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Fail
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <Alert variant={result.success ? "default" : "destructive"}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {result.message}
                      </AlertDescription>
                    </Alert>
                    
                    {result.data && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          View Raw Data
                        </summary>
                        <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Run the database tests to check connection and schema</li>
                <li>If tests fail, check the error messages for specific issues</li>
                <li>If "column does not exist" errors occur, run the SQL migration script</li>
                <li>Check the browser console for detailed error logs</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
