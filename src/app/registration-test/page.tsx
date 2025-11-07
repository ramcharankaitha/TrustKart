'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Store,
  User,
  Database,
  RefreshCw
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function RegistrationTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const testRegistration = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test 1: Check if registerShop method exists
      try {
        if (typeof LoginDatabasePlugin.registerShop === 'function') {
          results.registerShopMethod = '✅ Method exists';
        } else {
          results.registerShopMethod = '❌ Method missing';
        }
      } catch (error) {
        results.registerShopMethod = `❌ Error: ${error}`;
      }

      // Test 2: Test user creation
      try {
        const userResult = await LoginDatabasePlugin.createUserAccount({
          email: 'test-registration@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          password: 'test123',
          phone: '9876543210',
          aadhaarNumber: '123456789012'
        });
        
        if (userResult.success) {
          results.userCreation = '✅ User creation works';
          // Clean up test user
          try {
            // Note: In a real app, you'd delete the test user
            console.log('Test user created successfully');
          } catch (cleanupError) {
            console.warn('Could not clean up test user:', cleanupError);
          }
        } else {
          results.userCreation = `❌ User creation failed: ${userResult.error}`;
        }
      } catch (error) {
        results.userCreation = `❌ User creation error: ${error}`;
      }

      // Test 3: Test shop registration
      try {
        const shopResult = await LoginDatabasePlugin.registerShop({
          ownerName: 'Test Shopkeeper',
          shopName: 'Test Shop',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          email: 'test-shop@example.com',
          mobileNumber: '9876543210',
          dateOfBirth: '1990-01-01',
          aadhaarNumber: '123456789012',
          businessType: 'grocery',
          description: 'Test shop description',
          password: 'test123'
        });
        
        if (shopResult.success) {
          results.shopRegistration = '✅ Shop registration works';
        } else {
          results.shopRegistration = `❌ Shop registration failed: ${shopResult.error}`;
        }
      } catch (error) {
        results.shopRegistration = `❌ Shop registration error: ${error}`;
      }

      // Test 4: Test authentication
      try {
        const authResult = await LoginDatabasePlugin.authenticateUser(
          'test-registration@example.com',
          'test123',
          'CUSTOMER'
        );
        
        if (authResult.success) {
          results.authentication = '✅ Authentication works';
        } else {
          results.authentication = `❌ Authentication failed: ${authResult.error}`;
        }
      } catch (error) {
        results.authentication = `❌ Authentication error: ${error}`;
      }

      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      setError(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (result: string) => {
    if (result.includes('✅')) {
      return <Badge variant="default" className="bg-green-500">Working</Badge>;
    } else if (result.includes('❌')) {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Registration System Test</h1>
          <p className="text-muted-foreground">
            Test the fixed registration system
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Fixed Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>✅ Fixed:</strong> LoginDatabasePlugin.registerShop is not a function
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>✅ Fixed:</strong> Supabase user creation failed with better error handling
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>✅ Fixed:</strong> Database schema compatibility issues
              </AlertDescription>
            </Alert>

            <Button 
              onClick={testRegistration} 
              disabled={isTesting}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Registration System'}
            </Button>
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

        {Object.keys(testResults).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(String(result))}
                      <span className="text-sm text-muted-foreground">{String(result)}</span>
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
                <h3 className="font-semibold text-green-800 mb-2">Ready to Test:</h3>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Run the registration system test above</li>
                  <li>2. If all tests pass, try the actual registration</li>
                  <li>3. Go to shopkeeper registration page</li>
                  <li>4. Fill out the form and submit</li>
                </ol>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  onClick={() => window.location.href = '/shopkeeper-registration'}
                  className="w-full"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Test Shopkeeper Registration
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/database-schema-fix'}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Fix Database Schema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

