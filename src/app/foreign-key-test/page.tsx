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
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function ForeignKeyTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const testForeignKeyFix = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test 1: Create a test user
      const testEmail = `test-fk-${Date.now()}@example.com`;
      const userData = {
        email: testEmail,
        name: 'Test FK User',
        role: 'SHOPKEEPER',
        password: 'test123',
        phone: '9876543210',
        aadhaarNumber: '123456789012'
      };

      console.log('🔍 Testing user creation...');
      const userResult = await LoginDatabasePlugin.createUserAccount(userData);
      
      if (userResult.success) {
        results.userCreation = '✅ User created successfully';
        results.userId = userResult.user?.id;
        
        // Test 2: Create shop with proper owner ID
        const shopData = {
          ownerName: 'Test FK User',
          shopName: 'Test FK Shop',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          email: testEmail,
          mobileNumber: '9876543210',
          dateOfBirth: '1990-01-01',
          aadhaarNumber: '123456789012',
          businessType: 'grocery',
          description: 'Test shop for FK constraint',
          password: 'test123'
        };

        console.log('🔍 Testing shop creation with proper owner ID...');
        const shopResult = await LoginDatabasePlugin.createShopRegistrationWithOwner(
          shopData, 
          userResult.user.id
        );

        if (shopResult.success) {
          results.shopCreation = '✅ Shop created successfully';
          results.shopId = shopResult.shop?.id;
          results.foreignKeyTest = '✅ Foreign key constraint resolved';
        } else {
          results.shopCreation = `❌ Shop creation failed: ${shopResult.error}`;
          results.foreignKeyTest = `❌ Foreign key issue: ${shopResult.error}`;
        }
      } else {
        results.userCreation = `❌ User creation failed: ${userResult.error}`;
        results.foreignKeyTest = '❌ Cannot test FK without user';
      }

      // Test 3: Test complete registration flow
      const completeRegistrationData = {
        ownerName: 'Complete Test User',
        shopName: 'Complete Test Shop',
        address: 'Complete Test Address',
        city: 'Complete Test City',
        state: 'Complete Test State',
        pincode: '123456',
        email: `complete-test-${Date.now()}@example.com`,
        mobileNumber: '9876543210',
        dateOfBirth: '1990-01-01',
        aadhaarNumber: '123456789012',
        businessType: 'grocery',
        description: 'Complete test shop registration',
        password: 'test123'
      };

      console.log('🔍 Testing complete registration flow...');
      const completeResult = await LoginDatabasePlugin.registerShop(completeRegistrationData);

      if (completeResult.success) {
        results.completeRegistration = '✅ Complete registration successful';
        results.completeUserId = completeResult.user?.id;
        results.completeShopId = completeResult.shop?.id;
      } else {
        results.completeRegistration = `❌ Complete registration failed: ${completeResult.error}`;
        if (completeResult.step) {
          results.failedStep = `Failed at step: ${completeResult.step}`;
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('FK test error:', error);
      setError(error instanceof Error ? error.message : 'FK test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (result: string) => {
    if (result.includes('✅')) {
      return <Badge variant="default" className="bg-green-500">Success</Badge>;
    } else if (result.includes('❌')) {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Foreign Key Constraint Test</h1>
          <p className="text-muted-foreground">
            Test the fix for "shops_owner_id_fkey" foreign key constraint error
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Fixed Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> Shop creation failed: insert or update on table "shops" violates foreign key constraint "shops_owner_id_fkey"
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Solution Implemented:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Create user account first and get the actual user ID</li>
                <li>• Use the real user ID when creating the shop</li>
                <li>• Proper linking between user and shop records</li>
                <li>• Enhanced error handling for foreign key constraints</li>
              </ul>
            </div>

            <Button 
              onClick={testForeignKeyFix} 
              disabled={isTesting}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing FK Fix...' : 'Test Foreign Key Fix'}
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">After Testing:</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. If all tests pass, try the actual registration</li>
                  <li>2. Use a unique email address for registration</li>
                  <li>3. The foreign key constraint error should be resolved</li>
                  <li>4. User and shop will be properly linked</li>
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
                  onClick={() => window.location.href = '/registration-error-handler'}
                  className="w-full"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Error Handler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

