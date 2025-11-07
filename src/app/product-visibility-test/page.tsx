'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Package, Store } from 'lucide-react';
import { CustomerDatabasePlugin } from '@/lib/plugins/customer-database-plugin';
import { SupabaseDB } from '@/lib/supabase-db';

export default function ProductVisibilityTest() {
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadShops = async () => {
    setLoading(true);
    try {
      addResult('Loading shops...');
      const result = await CustomerDatabasePlugin.getApprovedShops();
      if (result.success) {
        setShops(result.shops);
        addResult(`✅ Loaded ${result.shops.length} shops`);
        if (result.shops.length > 0) {
          setSelectedShop(result.shops[0].id);
        }
      } else {
        addResult(`❌ Failed to load shops: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Error loading shops: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (shopId: string) => {
    setLoading(true);
    try {
      addResult(`Loading products for shop ${shopId}...`);
      const result = await CustomerDatabasePlugin.getShopProducts(shopId);
      if (result.success) {
        setProducts(result.products);
        addResult(`✅ Loaded ${result.products.length} products for shop`);
      } else {
        addResult(`❌ Failed to load products: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Error loading products: ${error.message}`);
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
      addResult('Creating test product...');
      const productData = {
        name: `Test Product ${Date.now()}`,
        description: 'This is a test product to verify visibility',
        price: 99.99,
        quantity: 10,
        shop_id: selectedShop,
        is_active: true,
        category: 'General',
        unit: 'piece',
        sku: `TEST-${Date.now()}`
      };

      const result = await SupabaseDB.createProduct(productData);
      if (result.data) {
        addResult(`✅ Test product created: ${result.data.name}`);
        // Reload products to see the new one
        await loadProducts(selectedShop);
      } else {
        addResult(`❌ Failed to create product: ${result.error?.message}`);
      }
    } catch (error) {
      addResult(`❌ Error creating product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      loadProducts(selectedShop);
    }
  }, [selectedShop]);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Visibility Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shops Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Shops ({shops.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedShop === shop.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedShop(shop.id)}
                  >
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-sm text-gray-600">Status: {shop.status}</div>
                    <div className="text-xs text-gray-500">ID: {shop.id}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="p-3 border rounded">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">Price: ₹{product.price}</div>
                    <div className="text-sm text-gray-600">Stock: {product.stockQty}</div>
                    <div className="text-xs text-gray-500">ID: {product.id}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadShops} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}
              Reload Shops
            </Button>
            
            <Button onClick={() => selectedShop && loadProducts(selectedShop)} disabled={loading || !selectedShop}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
              Reload Products
            </Button>
            
            <Button onClick={createTestProduct} disabled={loading || !selectedShop}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Create Test Product
            </Button>
          </div>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Reload Shops" to load all available shops</li>
                <li>Select a shop to see its products</li>
                <li>Click "Create Test Product" to add a new product</li>
                <li>Check if the product appears in the products list</li>
                <li>Go to customer dashboard to verify the product is visible</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}