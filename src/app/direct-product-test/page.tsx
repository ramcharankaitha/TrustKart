'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Package, Store, RefreshCw } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function DirectProductTest() {
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadShops = async () => {
    setLoading(true);
    try {
      addResult('Loading shops using SupabaseDB.getAllShops()...');
      const { data: shops, error } = await SupabaseDB.getAllShops();
      
      if (error) {
        addResult(`❌ Error loading shops: ${error.message}`);
        return;
      }

      setShops(shops || []);
      addResult(`✅ Loaded ${shops?.length || 0} shops`);
      
      if (shops && shops.length > 0) {
        setSelectedShop(shops[0].id);
        addResult(`Selected first shop: ${shops[0].name} (${shops[0].id})`);
      }
    } catch (error) {
      addResult(`❌ Exception loading shops: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (shopId: string) => {
    setLoading(true);
    try {
      addResult(`Loading products for shop ${shopId} using SupabaseDB.getProductsByShop()...`);
      const { data: products, error } = await SupabaseDB.getProductsByShop(shopId);
      
      if (error) {
        addResult(`❌ Error loading products: ${error.message}`);
        return;
      }

      setProducts(products || []);
      addResult(`✅ Loaded ${products?.length || 0} products for shop ${shopId}`);
      
      if (products && products.length > 0) {
        addResult(`Sample product: ${products[0].name} - ₹${products[0].price}`);
      }
    } catch (error) {
      addResult(`❌ Exception loading products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestProduct = async () => {
    if (!selectedShop) {
      addResult('❌ No shop selected');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: `Direct Test Product ${Date.now()}`,
        description: 'This product was created using direct SupabaseDB.createProduct()',
        price: 149.99,
        quantity: 20,
        shop_id: selectedShop,
        is_active: true,
        category: 'Test',
        unit: 'piece',
        sku: `DIRECT-${Date.now()}`
      };

      addResult(`Creating test product: ${productData.name}`);
      const { data, error } = await SupabaseDB.createProduct(productData);
      
      if (error) {
        addResult(`❌ Error creating product: ${error.message}`);
        return;
      }

      addResult(`✅ Product created successfully: ${data?.name}`);
      
      // Immediately load products to verify it appears
      await loadProducts(selectedShop);
      
    } catch (error) {
      addResult(`❌ Exception creating product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Direct SupabaseDB Product Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{shops.length}</div>
                <div className="text-sm text-gray-600">Available shops</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{products.length}</div>
                <div className="text-sm text-gray-600">Visible products</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{testResults.length}</div>
                <div className="text-sm text-gray-600">Completed steps</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadShops} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}
              Load Shops
            </Button>
            
            <Button 
              onClick={() => selectedShop && loadProducts(selectedShop)} 
              disabled={loading || !selectedShop}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
              Load Products
            </Button>
            
            <Button onClick={createTestProduct} disabled={loading || !selectedShop}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
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
                    <div 
                      key={shop.id} 
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedShop === shop.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedShop(shop.id)}
                    >
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
                  Products for Selected Shop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {products.map((product) => (
                    <div key={product.id} className="p-3 border rounded">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">Price: ₹{product.price}</div>
                      <div className="text-sm text-gray-600">Stock: {product.quantity}</div>
                      <div className="text-sm text-gray-600">Active: {product.is_active ? 'Yes' : 'No'}</div>
                      <div className="text-xs text-gray-500">ID: {product.id}</div>
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
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono p-2 bg-gray-100 rounded">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>This test uses direct SupabaseDB methods:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li><code>SupabaseDB.getAllShops()</code> - Load all shops</li>
                <li><code>SupabaseDB.getProductsByShop(shopId)</code> - Load products for a shop</li>
                <li><code>SupabaseDB.createProduct(productData)</code> - Create a new product</li>
                <li>Verify products appear immediately after creation</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
