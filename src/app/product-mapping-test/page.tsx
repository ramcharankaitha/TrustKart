'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Package, Store, Database } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';
import { CustomerDatabasePlugin } from '@/lib/plugins/customer-database-plugin';

export default function ProductMappingTest() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const addResult = (step: string, result: any) => {
    setTestResults(prev => [...prev, { step, result, timestamp: new Date().toISOString() }]);
  };

  const runCompleteTest = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Step 1: Test Database Connection
      addResult('1. Database Connection Test', 'Starting...');
      const connectionTest = await SupabaseDB.testDatabaseConnection();
      addResult('1. Database Connection Test', connectionTest);

      // Step 2: Get All Shops
      addResult('2. Fetch All Shops', 'Starting...');
      const shopsResult = await CustomerDatabasePlugin.getApprovedShops();
      addResult('2. Fetch All Shops', shopsResult);
      
      if (shopsResult.success && shopsResult.shops.length > 0) {
        setShops(shopsResult.shops);
        
        // Step 3: Create Test Product for First Shop
        const firstShop = shopsResult.shops[0];
        addResult('3. Create Test Product', `Creating product for shop: ${firstShop.name} (${firstShop.id})`);
        
        const productData = {
          name: `Test Product ${Date.now()}`,
          description: 'This is a test product to verify customer visibility',
          price: 199.99,
          quantity: 25,
          shop_id: firstShop.id,
          is_active: true,
          category: 'General',
          unit: 'piece',
          sku: `TEST-${Date.now()}`
        };

        const createResult = await SupabaseDB.createProduct(productData);
        addResult('3. Create Test Product', createResult);

        if (createResult.data) {
          // Step 4: Immediately Fetch Products for This Shop
          addResult('4. Fetch Products After Creation', `Fetching products for shop: ${firstShop.id}`);
          const fetchResult = await CustomerDatabasePlugin.getShopProducts(firstShop.id);
          addResult('4. Fetch Products After Creation', fetchResult);
          
          if (fetchResult.success) {
            setProducts(fetchResult.products);
          }

          // Step 5: Test Direct Database Query
          addResult('5. Direct Database Query', 'Querying products table directly...');
          const directQuery = await SupabaseDB.getProductsByShop(firstShop.id);
          addResult('5. Direct Database Query', directQuery);
        }
      }

      // Step 6: Test All Shops Products
      addResult('6. Test All Shops Products', 'Testing products for all shops...');
      for (const shop of shopsResult.shops) {
        const shopProducts = await CustomerDatabasePlugin.getShopProducts(shop.id);
        addResult(`6. Products for ${shop.name}`, shopProducts);
      }

    } catch (error) {
      addResult('Test Error', { error: error.message, stack: error.stack });
    } finally {
      setLoading(false);
    }
  };

  const createTestProduct = async () => {
    if (shops.length === 0) {
      addResult('Error', 'No shops available. Run complete test first.');
      return;
    }

    setLoading(true);
    try {
      const firstShop = shops[0];
      const productData = {
        name: `Manual Test Product ${Date.now()}`,
        description: 'Manual test product creation',
        price: 299.99,
        quantity: 15,
        shop_id: firstShop.id,
        is_active: true,
        category: 'Test',
        unit: 'piece',
        sku: `MANUAL-${Date.now()}`
      };

      addResult('Manual Product Creation', productData);
      const result = await SupabaseDB.createProduct(productData);
      addResult('Manual Product Creation Result', result);

      if (result.data) {
        // Immediately test visibility
        const visibilityTest = await CustomerDatabasePlugin.getShopProducts(firstShop.id);
        addResult('Visibility Test After Manual Creation', visibilityTest);
      }

    } catch (error) {
      addResult('Manual Test Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Product Mapping Test - Shopkeeper to Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shops Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{shops.length}</div>
                <div className="text-sm text-gray-600">Available shops</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Products Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{products.length}</div>
                <div className="text-sm text-gray-600">Visible products</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{testResults.length}</div>
                <div className="text-sm text-gray-600">Test steps completed</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={runCompleteTest} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Complete Test...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Run Complete Product Mapping Test
                </>
              )}
            </Button>
            
            <Button onClick={createTestProduct} disabled={loading || shops.length === 0}>
              <Package className="mr-2 h-4 w-4" />
              Create Test Product
            </Button>
          </div>

          {/* Shops List */}
          {shops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Available Shops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shops.map((shop) => (
                    <div key={shop.id} className="p-3 border rounded">
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm text-gray-600">ID: {shop.id}</div>
                      <div className="text-sm text-gray-600">Status: {shop.status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products List */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Visible Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {products.map((product) => (
                    <div key={product.id} className="p-3 border rounded">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">Price: ₹{product.price}</div>
                      <div className="text-sm text-gray-600">Stock: {product.stockQty}</div>
                      <div className="text-sm text-gray-600">Shop ID: {product.shopId}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-medium text-sm">{result.step}</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                    <div className="text-xs text-gray-500 mt-1">{result.timestamp}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>This test will:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Test database connection</li>
                <li>Fetch all available shops</li>
                <li>Create a test product for the first shop</li>
                <li>Immediately check if the product is visible to customers</li>
                <li>Test direct database queries</li>
                <li>Show detailed results for debugging</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
