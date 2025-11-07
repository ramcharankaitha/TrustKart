'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Package, Store, User } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';
import { CustomerDatabasePlugin } from '@/lib/plugins/customer-database-plugin';
import { useToast } from '@/hooks/use-toast';

export default function ProductVisibilityDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testProduct, setTestProduct] = useState({
    name: 'Test Product',
    description: 'This is a test product',
    price: '99.99',
    quantity: '10',
    shopId: ''
  });
  const { toast } = useToast();

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runCompleteDiagnostic = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Environment Variables
      const envTest = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      };
      addResult('1. Environment Variables', envTest);

      // Test 2: Database Connection
      const connectionTest = await SupabaseDB.testDatabaseConnection();
      addResult('2. Database Connection', connectionTest);

      // Test 3: Get All Shops
      const shopsResult = await CustomerDatabasePlugin.getApprovedShops();
      addResult('3. Get All Shops', shopsResult);

      // Test 4: If we have shops, test getting products for each shop
      if (shopsResult.success && shopsResult.shops.length > 0) {
        for (const shop of shopsResult.shops) {
          const productsResult = await CustomerDatabasePlugin.getShopProducts(shop.id);
          addResult(`4. Products for ${shop.name} (${shop.id})`, productsResult);
        }
      }

      // Test 5: Test creating a product if we have a shop
      if (shopsResult.success && shopsResult.shops.length > 0) {
        const firstShop = shopsResult.shops[0];
        setTestProduct(prev => ({ ...prev, shopId: firstShop.id }));
        
        const productData = {
          name: testProduct.name,
          description: testProduct.description,
          price: Number(testProduct.price),
          quantity: Number(testProduct.quantity),
          shop_id: firstShop.id,
          is_active: true,
        };

        addResult('5. Creating Test Product', productData);
        
        const createResult = await SupabaseDB.createProduct(productData);
        addResult('6. Product Creation Result', createResult);

        // Test 6: Immediately fetch products for this shop
        if (createResult.data) {
          const fetchResult = await CustomerDatabasePlugin.getShopProducts(firstShop.id);
          addResult('7. Fetch Products After Creation', fetchResult);
        }
      }

    } catch (error) {
      addResult('Diagnostic Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSpecificShop = async () => {
    if (!testProduct.shopId.trim()) {
      toast({
        variant: "destructive",
        title: "No Shop ID",
        description: "Please run the complete diagnostic first to get a shop ID.",
      });
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: testProduct.name,
        description: testProduct.description,
        price: Number(testProduct.price),
        quantity: Number(testProduct.quantity),
        shop_id: testProduct.shopId,
        is_active: true,
      };

      addResult('Creating Test Product', productData);
      
      const createResult = await SupabaseDB.createProduct(productData);
      addResult('Product Creation Result', createResult);

      if (createResult.data) {
        const fetchResult = await CustomerDatabasePlugin.getShopProducts(testProduct.shopId);
        addResult('Fetch Products After Creation', fetchResult);
      }

    } catch (error) {
      addResult('Test Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Visibility Diagnostic Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={testProduct.name}
                onChange={(e) => setTestProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Test Product"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={testProduct.description}
                onChange={(e) => setTestProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Test description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={testProduct.price}
                onChange={(e) => setTestProduct(prev => ({ ...prev, price: e.target.value }))}
                placeholder="99.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={testProduct.quantity}
                onChange={(e) => setTestProduct(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="10"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shopId">Shop ID (from diagnostic)</Label>
              <Input
                id="shopId"
                value={testProduct.shopId}
                onChange={(e) => setTestProduct(prev => ({ ...prev, shopId: e.target.value }))}
                placeholder="Will be filled after running diagnostic"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runCompleteDiagnostic} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Complete Diagnostic...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Run Complete Diagnostic
                </>
              )}
            </Button>
            
            <Button onClick={testSpecificShop} disabled={loading || !testProduct.shopId.trim()}>
              <Package className="mr-2 h-4 w-4" />
              Test Product Creation
            </Button>
          </div>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
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
              <strong>How to use this diagnostic:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Run Complete Diagnostic" to test the entire flow</li>
                <li>Check the results to see where the issue is</li>
                <li>Use "Test Product Creation" to create a test product</li>
                <li>Check if the product appears in customer view</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
