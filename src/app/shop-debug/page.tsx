'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SupabaseDB } from '@/lib/supabase-db';
import { AlertTriangle, CheckCircle, RefreshCw, User, Store } from 'lucide-react';

export default function ShopDebugPage() {
  const [userSession, setUserSession] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      setUserSession(session);
      console.log('🔍 User session loaded:', session);
    } catch (error) {
      console.error('❌ Error loading user session:', error);
      setError('Failed to load user session');
    }
  };

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userSession?.id) {
        setError('No user session found. Please log in first.');
        return;
      }

      console.log('🔍 Loading shops for user:', userSession.id);
      
      // Get shops owned by current user
      const { data, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      
      if (shopsError) {
        console.error('❌ Error loading shops:', shopsError);
        setError(`Failed to load shops: ${shopsError.message}`);
        return;
      }

      console.log('✅ Shops loaded:', data);
      setShops(data || []);
    } catch (error: any) {
      console.error('❌ Error loading shops:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllShops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading all shops...');
      
      const { data, error: shopsError } = await SupabaseDB.getAllShops();
      
      if (shopsError) {
        console.error('❌ Error loading all shops:', shopsError);
        setError(`Failed to load all shops: ${shopsError.message}`);
        return;
      }

      console.log('✅ All shops loaded:', data);
      setShops(data || []);
    } catch (error: any) {
      console.error('❌ Error loading all shops:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shop Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User Session Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              User Session
            </h3>
            {userSession ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(userSession, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No user session found. Please log in first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={loadShops} 
              disabled={loading || !userSession?.id}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Load My Shops
            </Button>
            
            <Button 
              onClick={loadAllShops} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Load All Shops
            </Button>
          </div>

          {/* Shops Display */}
          {shops.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Shops ({shops.length})
              </h3>
              <div className="space-y-4">
                {shops.map((shop) => (
                  <Card key={shop.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{shop.name}</h4>
                          <Badge variant={shop.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {shop.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Owner ID: {shop.owner_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Address: {shop.address}, {shop.city}, {shop.state}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Phone: {shop.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Email: {shop.email}
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(shop, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Shops Message */}
          {shops.length === 0 && !loading && userSession && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No shops found. This could mean:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>You haven't registered a shop yet</li>
                  <li>Your shop registration is still pending</li>
                  <li>There's an issue with the database connection</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Debug Instructions:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Check if you're logged in (User Session should show your details)</li>
              <li>Click "Load My Shops" to see shops owned by your user ID</li>
              <li>Click "Load All Shops" to see all shops in the database</li>
              <li>If no shops are found, you may need to register a shop first</li>
              <li>Check the console for detailed error messages</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
