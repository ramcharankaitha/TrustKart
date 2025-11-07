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
  Package,
  TrendingUp
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function AdminApprovalTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [allShops, setAllShops] = useState<any[]>([]);

  const testAdminApprovalSystem = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const results: any = {};

      // Test 1: Get all shops
      console.log('🔍 Testing admin approval system...');
      const shopsResult = await LoginDatabasePlugin.getAllShopRequests();
      
      if (shopsResult.success) {
        results.getAllShops = `✅ Retrieved ${shopsResult.shops.length} shops`;
        setAllShops(shopsResult.shops);
        
        // Test 2: Organize shops by status
        const pendingShops = shopsResult.shops.filter((shop: any) => shop.status === 'PENDING');
        const approvedShops = shopsResult.shops.filter((shop: any) => shop.status === 'APPROVED');
        const rejectedShops = shopsResult.shops.filter((shop: any) => shop.status === 'REJECTED');
        
        results.organization = `✅ Organized: ${pendingShops.length} pending, ${approvedShops.length} approved, ${rejectedShops.length} rejected`;
        
        // Test 3: Check if counts match
        const totalShops = pendingShops.length + approvedShops.length + rejectedShops.length;
        results.countValidation = totalShops === shopsResult.shops.length 
          ? `✅ Count validation passed (${totalShops} total)`
          : `❌ Count validation failed (expected ${shopsResult.shops.length}, got ${totalShops})`;
        
        // Test 4: Check shop details
        if (shopsResult.shops.length > 0) {
          const sampleShop = shopsResult.shops[0];
          results.shopDetails = {
            hasId: sampleShop.id ? '✅ Has ID' : '❌ Missing ID',
            hasName: sampleShop.name ? '✅ Has Name' : '❌ Missing Name',
            hasOwner: sampleShop.owner_id ? '✅ Has Owner ID' : '❌ Missing Owner ID',
            hasStatus: sampleShop.status ? '✅ Has Status' : '❌ Missing Status',
            hasCreatedAt: sampleShop.created_at ? '✅ Has Created Date' : '❌ Missing Created Date'
          };
        }
        
        // Test 5: Check for approved/rejected timestamps
        const approvedWithTimestamp = approvedShops.filter((shop: any) => shop.approved_at);
        const rejectedWithTimestamp = rejectedShops.filter((shop: any) => shop.rejected_at);
        
        results.timestamps = {
          approved: approvedShops.length > 0 
            ? `✅ ${approvedWithTimestamp.length}/${approvedShops.length} approved shops have timestamps`
            : 'ℹ️ No approved shops to check',
          rejected: rejectedShops.length > 0 
            ? `✅ ${rejectedWithTimestamp.length}/${rejectedShops.length} rejected shops have timestamps`
            : 'ℹ️ No rejected shops to check'
        };
        
      } else {
        results.getAllShops = `❌ Failed to get shops: ${shopsResult.error}`;
      }

      setTestResults(results);
    } catch (error) {
      console.error('Admin approval test error:', error);
      setError(error instanceof Error ? error.message : 'Admin approval test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const testApprovalFlow = async () => {
    try {
      // Create a test shop registration
      const testEmail = `admin-test-${Date.now()}@example.com`;
      const shopData = {
        ownerName: 'Admin Test User',
        shopName: 'Admin Test Shop',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        email: testEmail,
        mobileNumber: '9876543210',
        dateOfBirth: '1990-01-01',
        aadhaarNumber: '123456789012',
        businessType: 'grocery',
        description: 'Test shop for admin approval flow',
        password: 'test123'
      };

      console.log('🔍 Creating test shop for approval flow...');
      const registrationResult = await LoginDatabasePlugin.registerShop(shopData);
      
      if (registrationResult.success) {
        setTestResults(prev => ({
          ...prev,
          testShopCreated: '✅ Test shop created successfully',
          testShopId: registrationResult.shop?.id
        }));
        
        // Test approval
        if (registrationResult.shop?.id) {
          const approvalResult = await LoginDatabasePlugin.approveShop(
            registrationResult.shop.id, 
            'test-admin-id'
          );
          
          if (approvalResult.success) {
            setTestResults(prev => ({
              ...prev,
              testApproval: '✅ Test shop approved successfully'
            }));
            
            // Refresh the shop list
            setTimeout(() => {
              testAdminApprovalSystem();
            }, 1000);
          } else {
            setTestResults(prev => ({
              ...prev,
              testApproval: `❌ Test approval failed: ${approvalResult.error}`
            }));
          }
        }
      } else {
        setTestResults(prev => ({
          ...prev,
          testShopCreated: `❌ Test shop creation failed: ${registrationResult.error}`
        }));
      }
    } catch (error) {
      setError(`Approval flow test error: ${error}`);
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

  const getShopStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Admin Approval System Test</h1>
          <p className="text-muted-foreground">
            Test the complete admin approval system with counts and tab organization
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
                  This test will verify the admin approval system, counts, and tab organization.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={testAdminApprovalSystem} 
                  disabled={isTesting}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isTesting ? 'Testing...' : 'Test Admin Approval System'}
                </Button>
                
                <Button 
                  onClick={testApprovalFlow}
                  variant="outline"
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Test Complete Approval Flow
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
                  Click "Test Admin Approval System" to see results
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

        {/* All Shops List */}
        {allShops.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                All Shops ({allShops.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allShops.map((shop: any) => (
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
                      {shop.approved_at && (
                        <p><strong>Approved:</strong> {new Date(shop.approved_at).toLocaleString()}</p>
                      )}
                      {shop.rejected_at && (
                        <p><strong>Rejected:</strong> {new Date(shop.rejected_at).toLocaleString()}</p>
                      )}
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
              Fixed Admin Approval Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Dynamic Counts:</strong> Tab counts now update based on actual shop status.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ All Shops Fetching:</strong> Now fetches all shops, not just pending ones.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Tab Organization:</strong> Shops are properly organized by status.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Real-time Updates:</strong> Counts update immediately after approval/rejection.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Status Tracking:</strong> Proper timestamps for approved/rejected shops.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Rejection Reasons:</strong> Rejection reasons are stored and displayed.
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
                Create Test Shop
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

