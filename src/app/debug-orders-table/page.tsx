'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB, supabase } from '@/lib/supabase-db';

export default function DebugOrdersTablePage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testOrdersTable = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🔍 Testing orders table...');

      // Test 1: Check if orders table exists
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);

      console.log('Orders query result:', { orders, ordersError });

      // Test 2: Check if order_items table exists
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(5);

      console.log('Order items query result:', { orderItems, orderItemsError });

      // Test 3: Check shops table
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .limit(5);

      console.log('Shops query result:', { shops, shopsError });

      // Test 4: Check products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5);

      console.log('Products query result:', { products, productsError });

      // Test 5: Check users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      console.log('Users query result:', { users, usersError });

      setResults({
        orders: { data: orders, error: ordersError },
        orderItems: { data: orderItems, error: orderItemsError },
        shops: { data: shops, error: shopsError },
        products: { data: products, error: productsError },
        users: { data: users, error: usersError }
      });

    } catch (error) {
      console.error('❌ Test error:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    setLoading(true);
    try {
      console.log('🔍 Creating test order...');

      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      console.log('User session:', userSession);

      if (!userSession.id) {
        setResults({ error: 'No user session found' });
        return;
      }

      // Get shops owned by this user
      const { data: shops, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      console.log('Shops result:', { shops, shopsError });

      if (shopsError || !shops || shops.length === 0) {
        setResults({ error: 'No shops found for user' });
        return;
      }

      const shopId = shops[0].id;
      console.log('Using shop ID:', shopId);

      // Create test order
      const testOrderData = {
        customer_id: userSession.id,
        shop_id: shopId,
        total_amount: 100.00,
        subtotal: 95.00,
        delivery_address: "Test Address",
        delivery_phone: "1234567890",
        notes: "Test order",
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      console.log('Creating test order with data:', testOrderData);

      const { data: order, error: orderError } = await SupabaseDB.createOrder(testOrderData);
      console.log('Order creation result:', { order, orderError });

      if (orderError) {
        setResults({ error: `Order creation failed: ${orderError.message}` });
        return;
      }

      // Create test order item
      const testItemData = {
        order_id: order.id,
        product_id: 'test-product-id',
        quantity: 1,
        price: 50.00,
        approval_status: 'PENDING'
      };

      console.log('Creating test order item with data:', testItemData);

      const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(testItemData);
      console.log('Order item creation result:', { orderItem, itemError });

      setResults({
        order: { data: order, error: orderError },
        orderItem: { data: orderItem, error: itemError }
      });

    } catch (error) {
      console.error('❌ Test order creation error:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Orders Table</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testOrdersTable} disabled={loading}>
              {loading ? 'Testing...' : 'Test Tables'}
            </Button>
            <Button onClick={createTestOrder} disabled={loading} variant="outline">
              {loading ? 'Creating...' : 'Create Test Order'}
            </Button>
          </div>

          {results && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
