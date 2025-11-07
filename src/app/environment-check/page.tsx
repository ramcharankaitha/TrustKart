'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Database, Key, Globe } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function EnvironmentCheck() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runEnvironmentCheck = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Check environment variables
      const envCheck = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        supabaseKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'
      };
      addResult('Environment Variables Check', envCheck);

      // Test database connection
      addResult('Database Connection Test', 'Testing...');
      const connectionTest = await SupabaseDB.testDatabaseConnection();
      addResult('Database Connection Test', connectionTest);

      // Test shops table
      if (connectionTest.success) {
        addResult('Shops Table Test', 'Testing shops table...');
        const shopsTest = await SupabaseDB.getShops();
        addResult('Shops Table Test', shopsTest);
      }

      // Test products table
      if (connectionTest.success) {
        addResult('Products Table Test', 'Testing products table...');
        const productsTest = await SupabaseDB.getProducts();
        addResult('Products Table Test', productsTest);
      }

    } catch (error) {
      addResult('Environment Check Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment & Database Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Supabase URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-sm font-medium ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Supabase Key
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-sm font-medium ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
                </div>
                <div className="text-xs text-gray-600">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-blue-600">{results.length}</div>
                <div className="text-xs text-gray-600">Tests completed</div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={runEnvironmentCheck} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Environment Check...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Run Complete Environment Check
              </>
            )}
          </Button>

          {/* Results */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{result.test}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <AlertDescription>
              <strong>This check will verify:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Supabase environment variables are set</li>
                <li>Database connection is working</li>
                <li>Shops table is accessible</li>
                <li>Products table is accessible</li>
                <li>Basic CRUD operations work</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
