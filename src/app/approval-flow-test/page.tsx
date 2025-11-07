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
  XCircle
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function ApprovalFlowTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingShops, setPendingShops] = useState<any[]>([]);

  const testApprovalFlow = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test 1: Create a test shop registration
      const testEmail = `approval-test-${Date.now()}@example.com`;
      const shopData = {
        ownerName: 'Approval Test User',
        shopName: 'Approval Test Shop',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        email: testEmail,
        mobileNumber: '9876543210',
        dateOfBirth: '1990-01-01',
        aadhaarNumber: '123456789012',
        businessType: 'grocery',
        description: 'Test shop for approval flow',
        password: 'test123'
      };

      console.log('🔍 Testing complete registration...');
      const registrationResult = await LoginDatabasePlugin.registerShop(shopData);
      
      if (registrationResult.success) {
        results.registration = '✅ Registration successful';
        results.shopId = registrationResult.shop?.id;
        results.userId = registrationResult.user?.id;
        
        // Test 2: Check if shop appears in pending list
        console.log('🔍 Checking pending shops...');
        const pendingResult = await LoginDatabasePlugin.getPendingShopRequests();
        
        if (pendingResult.success) {
          const testShop = pendingResult.shops.find((shop: any) => shop.id === registrationResult.shop?.id);
          if (testShop) {
            results.pendingCheck = '✅ Shop appears in pending list';
            results.shopStatus = testShop.status;
            setPendingShops(pendingResult.shops);
          } else {
            results.pendingCheck = '❌ Shop not found in pending list';
          }
        } else {
          results.pendingCheck = `❌ Failed to fetch pending shops: ${pendingResult.error}`;
        }
        
        // Test 3: Test approval process
        if (registrationResult.shop?.id) {
          console.log('🔍 Testing approval process...');
          const approvalResult = await LoginDatabasePlugin.approveShop(
            registrationResult.shop.id, 
            'test-admin-id'
          );
          
          if (approvalResult.success) {
            results.approval = '✅ Approval successful';
            
            // Test 4: Check if shop is removed from pending list
            setTimeout(async () => {
              const updatedPendingResult = await LoginDatabasePlugin.getPendingShopRequests();
              if (updatedPendingResult.success) {
                const updatedTestShop = updatedPendingResult.shops.find((shop: any) => shop.id === registrationResult.shop?.id);
                if (!updatedTestShop) {
                  results.postApprovalCheck = '✅ Shop removed from pending list after approval';
                } else {
                  results.postApprovalCheck = '❌ Shop still in pending list after approval';
                }
                setTestResults({ ...results });
              }
            }, 1000);
            
          } else {
            results.approval = `❌ Approval failed: ${approvalResult.error}`;
          }
        }
        
      } else {
        results.registration = `❌ Registration failed: ${registrationResult.error}`;
      }

      setTestResults(results);
    } catch (error) {
      console.error('Approval flow test error:', error);
      setError(error instanceof Error ? error.message : 'Approval flow test failed');
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

  const getShopStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Approval Flow Test</h1>
          <p className="text-muted-foreground">
            Test the complete approval flow: Registration → Pending → Approval → UI Update
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                  This test will create a shop registration, check if it appears in pending list, 
                  approve it, and verify the UI updates correctly.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={testApprovalFlow} 
                disabled={isTesting}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing Approval Flow...' : 'Test Complete Approval Flow'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Click "Test Complete Approval Flow" to see results
                </p>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Shops List */}
        {pendingShops.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Current Pending Shops ({pendingShops.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingShops.map((shop: any) => (
                  <div key={shop.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{shop.name}</h3>
                          <p className="text-sm text-muted-foreground">{shop.owner?.name || 'Unknown Owner'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getShopStatusBadge(shop.status)}
                        <Badge variant="outline">{shop.id}</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Email:</strong> {shop.email}</p>
                      <p><strong>Phone:</strong> {shop.phone}</p>
                      <p><strong>Address:</strong> {shop.address}</p>
                      <p><strong>Created:</strong> {new Date(shop.created_at).toLocaleString()}</p>
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
              Fixed Approval Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Immediate UI Updates:</strong> Local state updates immediately after approval/rejection.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Proper Data Filtering:</strong> Only shows pending shops in admin panel.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Auto-Close Details:</strong> Closes request details after approval/rejection.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Database Sync:</strong> Refreshes data from database after UI updates.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Error Handling:</strong> Better error messages and recovery mechanisms.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Status Tracking:</strong> Proper status updates and timestamps.
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
                onClick={() => window.location.href = '/dashboard/admin-approvals'}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Admin Approvals Page
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/shopkeeper-registration'}
                className="w-full"
              >
                <Store className="h-4 w-4 mr-2" />
                Test Registration
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

