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
  RefreshCw,
  Eye,
  Clock,
  XCircle,
  Package
} from 'lucide-react';
import { SessionUtils } from '@/lib/utils/session-utils';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function ShopkeeperAuthTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const testShopkeeperAuth = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test 1: Check current session
      const session = SessionUtils.getUserSession();
      setSessionInfo(session);
      
      if (session) {
        results.sessionExists = '✅ User session found';
        results.userId = session.id;
        results.userEmail = session.email;
        results.userRole = session.role;
        
        // Test 2: Check role validation
        const isShopkeeper = SessionUtils.isShopkeeper();
        results.isShopkeeper = isShopkeeper ? '✅ User is shopkeeper' : '❌ User is not shopkeeper';
        
        const isAdmin = SessionUtils.isAdmin();
        results.isAdmin = isAdmin ? '✅ User is admin' : '❌ User is not admin';
        
        const isCustomer = SessionUtils.isCustomer();
        results.isCustomer = isCustomer ? '✅ User is customer' : '❌ User is not customer';
        
        // Test 3: Test role checking with different cases
        const roleTests = [
          { role: 'shopkeeper', expected: true },
          { role: 'SHOPKEEPER', expected: true },
          { role: 'Shopkeeper', expected: true },
          { role: 'admin', expected: false },
          { role: 'customer', expected: false }
        ];
        
        results.roleTests = {};
        roleTests.forEach(test => {
          const hasRole = SessionUtils.hasRole(test.role);
          results.roleTests[test.role] = hasRole === test.expected 
            ? `✅ Correct (${hasRole})` 
            : `❌ Incorrect (expected ${test.expected}, got ${hasRole})`;
        });
        
        // Test 4: Test shop access for shopkeeper
        if (isShopkeeper) {
          const userId = SessionUtils.getUserId();
          if (userId) {
            try {
              // Test getting shops for this user
              const shopsResult = await LoginDatabasePlugin.getPendingShopRequests();
              if (shopsResult.success) {
                const userShops = shopsResult.shops.filter((shop: any) => shop.owner_id === userId);
                results.userShops = `✅ Found ${userShops.length} shops for user`;
                results.shopDetails = userShops.map((shop: any) => ({
                  id: shop.id,
                  name: shop.name,
                  status: shop.status
                }));
              } else {
                results.userShops = `❌ Failed to get shops: ${shopsResult.error}`;
              }
            } catch (shopError) {
              results.userShops = `❌ Error getting shops: ${shopError}`;
            }
          }
        }
        
      } else {
        results.sessionExists = '❌ No user session found';
        results.recommendation = 'Please log in as a shopkeeper first';
      }

      setTestResults(results);
    } catch (error) {
      console.error('Shopkeeper auth test error:', error);
      setError(error instanceof Error ? error.message : 'Shopkeeper auth test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const testLogin = async () => {
    try {
      // Test with a known shopkeeper email
      const testEmail = 'test-shopkeeper@example.com';
      const testPassword = 'test123';
      
      const result = await LoginDatabasePlugin.authenticateUser(testEmail, testPassword, 'shopkeeper');
      
      if (result.success) {
        setError(null);
        setTestResults(prev => ({
          ...prev,
          loginTest: '✅ Login successful - try testing auth again'
        }));
      } else {
        setError(`Login failed: ${result.error}`);
      }
    } catch (error) {
      setError(`Login error: ${error}`);
    }
  };

  const getStatusBadge = (result: string) => {
    if (result.includes('✅')) {
      return <Badge variant="default" className="bg-green-500">Success</Badge>;
    } else if (result.includes('❌')) {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Shopkeeper Authentication Test</h1>
          <p className="text-muted-foreground">
            Test shopkeeper role authentication and orders access
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionInfo ? (
                <div className="space-y-3">
                  <div className="p-3 border rounded">
                    <div className="grid gap-2 text-sm">
                      <div><strong>ID:</strong> {sessionInfo.id}</div>
                      <div><strong>Email:</strong> {sessionInfo.email}</div>
                      <div><strong>Name:</strong> {sessionInfo.name || 'Not set'}</div>
                      <div><strong>Role:</strong> {sessionInfo.role}</div>
                      <div><strong>Login Time:</strong> {sessionInfo.loginTime ? new Date(sessionInfo.loginTime).toLocaleString() : 'Not set'}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant={SessionUtils.isShopkeeper() ? "default" : "secondary"}>
                      {SessionUtils.isShopkeeper() ? 'Shopkeeper' : 'Not Shopkeeper'}
                    </Badge>
                    <Badge variant={SessionUtils.isAdmin() ? "default" : "secondary"}>
                      {SessionUtils.isAdmin() ? 'Admin' : 'Not Admin'}
                    </Badge>
                    <Badge variant={SessionUtils.isCustomer() ? "default" : "secondary"}>
                      {SessionUtils.isCustomer() ? 'Customer' : 'Not Customer'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No session found</p>
                  <p className="text-sm text-muted-foreground">Please log in first</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This test will check your current session, role validation, and shop access.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={testShopkeeperAuth} 
                  disabled={isTesting}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isTesting ? 'Testing...' : 'Test Shopkeeper Auth'}
                </Button>
                
                <Button 
                  onClick={testLogin}
                  variant="outline"
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  Test Login
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
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

        {/* Fixed Issues */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Fixed Authentication Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Case-Insensitive Role Checking:</strong> Now handles SHOPKEEPER, shopkeeper, Shopkeeper, etc.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Session Validation:</strong> Proper session checking with error handling.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Role Utilities:</strong> Centralized role checking functions.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Better Error Messages:</strong> Clear error messages for authentication issues.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Shop Access:</strong> Proper shop filtering for shopkeepers.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Session Management:</strong> Improved session handling and cleanup.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => window.location.href = '/dashboard/simple-orders'}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Test Orders Page
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Login as Shopkeeper
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                <Store className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

