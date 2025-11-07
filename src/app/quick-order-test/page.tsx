'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-db';

export default function QuickOrderTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testOrdersDirectly = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🔍 Testing orders directly...');

      // Test 1: Check if orders table exists
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(10);

      console.log('Orders query result:', { orders, ordersError });

      // Test 2: Check if order_items table exists
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(10);

      console.log('Order items query result:', { orderItems, orderItemsError });

      // Test 3: Check shops table
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .limit(5);

      console.log('Shops query result:', { shops, shopsError });

      // Test 4: Check users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      console.log('Users query result:', { users, usersError });

      setResults({
        orders: { data: orders, error: ordersError },
        orderItems: { data: orderItems, error: orderItemsError },
        shops: { data: shops, error: shopsError },
        users: { data: users, error: usersError },
        summary: {
          ordersCount: orders?.length || 0,
          orderItemsCount: orderItems?.length || 0,
          shopsCount: shops?.length || 0,
          usersCount: users?.length || 0,
          ordersTableWorks: !ordersError,
          orderItemsTableWorks: !orderItemsError,
          shopsTableWorks: !shopsError,
          usersTableWorks: !usersError
        }
      });

    } catch (error) {
      console.error('❌ Test error:', error);
      setResults({ 
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    setLoading(true);
    try {
      console.log('🔍 Creating test order...');

      // Get first user and shop
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .limit(1);

      if (usersError || shopsError || !users || !shops || users.length === 0 || shops.length === 0) {
        setResults({ 
          error: 'Cannot create test order - missing users or shops',
          usersError,
          shopsError
        });
        return;
      }

      // Create test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: users[0].id,
          shop_id: shops[0].id,
          total_amount: 100.00,
          subtotal: 95.00,
          delivery_address: 'Test Address',
          delivery_phone: '1234567890',
          notes: 'Test order created from debug page',
          status: 'PENDING_APPROVAL',
          request_type: 'ORDER_REQUEST'
        })
        .select()
        .single();

      console.log('Order creation result:', { order, orderError });

      if (orderError) {
        setResults({ 
          error: `Order creation failed: ${orderError.message}`,
          details: orderError
        });
        return;
      }

      // Create test order item
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (productsError || !products || products.length === 0) {
        setResults({ 
          error: 'Cannot create order item - no products found',
          productsError
        });
        return;
      }

      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: products[0].id,
          quantity: 1,
          price: 50.00,
          approval_status: 'PENDING'
        })
        .select()
        .single();

      console.log('Order item creation result:', { orderItem, itemError });

      setResults({
        success: true,
        message: 'Test order created successfully!',
        order: order,
        orderItem: orderItem,
        itemError: itemError
      });

    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Order Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testOrdersDirectly} disabled={loading}>
              {loading ? 'Testing...' : 'Test Database Directly'}
            </Button>
            <Button onClick={createTestOrder} disabled={loading} variant="outline">
              {loading ? 'Creating...' : 'Create Test Order'}
            </Button>
          </div>

          {results && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
