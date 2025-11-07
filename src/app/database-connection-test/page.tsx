'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function DatabaseConnectionTest() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    const results: any = {};

    try {
      console.log('🧪 Testing database connection...');

      // Test 1: Check if we can connect to Supabase
      console.log('🧪 Test 1: Testing basic connection...');
      try {
        const { data, error } = await SupabaseDB.getAllUsers();
        results.test1 = { 
          success: !error, 
          data: data?.length || 0, 
          error: error?.message || 'No error' 
        };
        console.log('🧪 Test 1 result:', results.test1);
      } catch (err: any) {
        results.test1 = { success: false, error: err.message };
        console.error('🧪 Test 1 failed:', err);
      }

      // Test 2: Try to create a test user (will fail if user exists, but that's ok)
      console.log('🧪 Test 2: Testing user creation...');
      try {
        const testUserData = {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          role: 'customer',
          password: 'test123'
        };
        
        const { data, error } = await SupabaseDB.createUser(testUserData);
        results.test2 = { 
          success: !error, 
          data: data, 
          error: error?.message || 'No error' 
        };
        console.log('🧪 Test 2 result:', results.test2);
      } catch (err: any) {
        results.test2 = { success: false, error: err.message };
        console.error('🧪 Test 2 failed:', err);
      }

      // Test 3: Check users table structure
      console.log('🧪 Test 3: Testing table structure...');
      try {
        const { data, error } = await SupabaseDB.getUserByEmail('nonexistent@example.com');
        results.test3 = { 
          success: true, // This should fail with "not found" which is expected
          error: error?.message || 'No error',
          note: 'Expected to fail with "not found" error'
        };
        console.log('🧪 Test 3 result:', results.test3);
      } catch (err: any) {
        results.test3 = { success: false, error: err.message };
        console.error('🧪 Test 3 failed:', err);
      }

      setTestResults(results);

    } catch (err: any) {
      console.error('❌ Test error:', err);
      setError(`Test error: ${err.message}`);
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
            Database Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button onClick={testConnection} disabled={loading} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {loading ? 'Testing...' : 'Test Database Connection'}
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/shopkeeper-registration'} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Test Registration
            </Button>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                    <div key={testName} className="border rounded p-3">
                      <h4 className="font-medium mb-2">
                        Test {testName}: {
                          testName === 'test1' ? 'Basic Connection' : 
                          testName === 'test2' ? 'User Creation' : 
                          'Table Structure'
                        }
                      </h4>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span><strong>Success:</strong></span>
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{result.success ? 'Yes' : 'No'}</span>
                        </div>
                        {result.error && (
                          <div><strong>Error:</strong> {result.error}</div>
                        )}
                        {result.data && (
                          <div><strong>Data:</strong> {JSON.stringify(result.data)}</div>
                        )}
                        {result.note && (
                          <div><strong>Note:</strong> {result.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Test Database Connection" to run all tests</li>
                <li>Check the console for detailed logs</li>
                <li>Look at the test results to see what's working</li>
                <li>If tests pass, try the registration again</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}