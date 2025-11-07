'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB } from '@/lib/supabase-db';
import { useToast } from '@/hooks/use-toast';

export default function TestOrderFlowPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testCompleteOrderFlow = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🔍 Testing complete order flow...');

      // Step 1: Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      console.log('User session:', userSession);

      if (!userSession.id) {
        setResults({ error: 'No user session found. Please log in as a shopkeeper.' });
        return;
      }

      // Step 2: Get shops owned by this user
      const { data: shops, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      console.log('Shops result:', { shops, shopsError });

      if (shopsError || !shops || shops.length === 0) {
        setResults({ error: 'No shops found for user. Please register a shop first.' });
        return;
      }

      const shopId = shops[0].id;
      console.log('Using shop ID:', shopId);

      // Step 3: Check if orders table exists
      const { data: ordersCheck, error: ordersCheckError } = await SupabaseDB.supabase
        .from('orders')
        .select('*')
        .limit(1);

      console.log('Orders table check:', { ordersCheck, ordersCheckError });

      if (ordersCheckError) {
        setResults({ 
          error: `Orders table doesn't exist or has issues: ${ordersCheckError.message}`,
          suggestion: 'Please run the fix-orders-table-complete.sql script in Supabase'
        });
        return;
      }

      // Step 4: Create a test order
      const testOrderData = {
        customer_id: userSession.id, // Using same user as customer for test
        shop_id: shopId,
        total_amount: 150.00,
        subtotal: 145.00,
        delivery_address: "Test Address, Test City",
        delivery_phone: "9876543210",
        notes: "Test order for debugging order flow",
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      console.log('Creating test order with data:', testOrderData);

      const { data: order, error: orderError } = await SupabaseDB.createOrder(testOrderData);
      console.log('Order creation result:', { order, orderError });

      if (orderError) {
        setResults({ 
          error: `Order creation failed: ${orderError.message}`,
          details: orderError
        });
        return;
      }

      // Step 5: Create test order item
      const { data: products, error: productsError } = await SupabaseDB.supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .limit(1);

      console.log('Products for shop:', { products, productsError });

      if (productsError || !products || products.length === 0) {
        setResults({ 
          error: 'No products found for this shop. Please add products first.',
          suggestion: 'Go to Add Products section and add some products'
        });
        return;
      }

      const testItemData = {
        order_id: order.id,
        product_id: products[0].id,
        quantity: 2,
        price: 75.00,
        approval_status: 'PENDING'
      };

      console.log('Creating test order item with data:', testItemData);

      const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(testItemData);
      console.log('Order item creation result:', { orderItem, itemError });

      if (itemError) {
        setResults({ 
          error: `Order item creation failed: ${itemError.message}`,
          details: itemError
        });
        return;
      }

      // Step 6: Test fetching orders for shopkeeper
      const { data: shopOrders, error: shopOrdersError } = await SupabaseDB.getOrdersByShop(shopId);
      console.log('Shop orders result:', { shopOrders, shopOrdersError });

      if (shopOrdersError) {
        setResults({ 
          error: `Failed to fetch orders for shop: ${shopOrdersError.message}`,
          details: shopOrdersError
        });
        return;
      }

      setResults({
        success: true,
        message: 'Order flow test completed successfully!',
        order: order,
        orderItem: orderItem,
        shopOrders: shopOrders,
        summary: {
          shopId: shopId,
          orderId: order.id,
          orderItemsCount: shopOrders?.length || 0,
          orderStatus: order.status
        }
      });

      toast({
        title: "Test Successful! 🎉",
        description: "Order flow is working correctly. Check the shopkeeper dashboard now.",
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

  const checkCurrentOrders = async () => {
    setLoading(true);
    try {
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        setResults({ error: 'No user session found' });
        return;
      }

      const { data: shops, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      if (shopsError || !shops || shops.length === 0) {
        setResults({ error: 'No shops found' });
        return;
      }

      const { data: orders, error: ordersError } = await SupabaseDB.getOrdersByShop(shops[0].id);
      
      setResults({
        currentOrders: orders,
        ordersError: ordersError,
        shopId: shops[0].id
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
          <CardTitle>Test Order Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testCompleteOrderFlow} disabled={loading}>
              {loading ? 'Testing...' : 'Test Complete Order Flow'}
            </Button>
            <Button onClick={checkCurrentOrders} disabled={loading} variant="outline">
              {loading ? 'Checking...' : 'Check Current Orders'}
            </Button>
          </div>

          {results && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Results:</h3>
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