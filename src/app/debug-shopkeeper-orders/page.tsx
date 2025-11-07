'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB } from '@/lib/supabase-db';
import { useToast } from '@/hooks/use-toast';

export default function DebugShopkeeperOrdersPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const debugShopkeeperOrders = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🔍 Debugging shopkeeper orders...');

      // Step 1: Check user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      console.log('User session:', userSession);

      if (!userSession.id) {
        setResults({ error: 'No user session found' });
        return;
      }

      // Step 2: Check if user is a shopkeeper
      if (userSession.role !== 'shopkeeper') {
        setResults({ 
          error: 'User is not a shopkeeper',
          userRole: userSession.role,
          suggestion: 'Please log in as a shopkeeper to test orders'
        });
        return;
      }

      // Step 3: Check shops owned by this user
      console.log('🔍 Checking shops for owner:', userSession.id);
      const { data: shops, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      console.log('Shops result:', { shops, shopsError });

      if (shopsError) {
        setResults({ 
          error: `Error fetching shops: ${shopsError.message}`,
          details: shopsError
        });
        return;
      }

      if (!shops || shops.length === 0) {
        setResults({ 
          error: 'No shops found for this user',
          suggestion: 'Please register a shop first',
          userId: userSession.id
        });
        return;
      }

      const shop = shops[0];
      console.log('Using shop:', shop);

      // Step 4: Check orders table structure
      const { data: ordersStructure, error: ordersStructureError } = await SupabaseDB.supabase
        .from('orders')
        .select('*')
        .limit(0);

      console.log('Orders table structure check:', { ordersStructure, ordersStructureError });

      // Step 5: Check if there are any orders for this shop
      const { data: allOrders, error: allOrdersError } = await SupabaseDB.supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop.id);

      console.log('All orders for shop:', { allOrders, allOrdersError });

      // Step 6: Check if there are any orders at all
      const { data: anyOrders, error: anyOrdersError } = await SupabaseDB.supabase
        .from('orders')
        .select('*')
        .limit(5);

      console.log('Any orders in database:', { anyOrders, anyOrdersError });

      // Step 7: Test the getOrdersByShop method
      const { data: shopOrders, error: shopOrdersError } = await SupabaseDB.getOrdersByShop(shop.id);
      console.log('Shop orders via method:', { shopOrders, shopOrdersError });

      // Step 8: Check order_items table
      const { data: orderItems, error: orderItemsError } = await SupabaseDB.supabase
        .from('order_items')
        .select('*')
        .limit(5);

      console.log('Order items:', { orderItems, orderItemsError });

      setResults({
        userSession: userSession,
        shop: shop,
        shopsCount: shops.length,
        ordersStructure: ordersStructureError ? ordersStructureError.message : 'OK',
        allOrdersForShop: allOrders,
        anyOrdersInDB: anyOrders,
        shopOrdersViaMethod: shopOrders,
        orderItems: orderItems,
        summary: {
          hasShop: true,
          shopId: shop.id,
          shopName: shop.name,
          ordersCount: allOrders?.length || 0,
          anyOrdersInDB: anyOrders?.length || 0,
          orderItemsCount: orderItems?.length || 0
        }
      });

    } catch (error) {
      console.error('❌ Debug error:', error);
      setResults({ 
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestOrderForShop = async () => {
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

      const shopId = shops[0].id;

      // Create test order
      const testOrderData = {
        customer_id: userSession.id,
        shop_id: shopId,
        total_amount: 200.00,
        subtotal: 190.00,
        delivery_address: "Test Address",
        delivery_phone: "9876543210",
        notes: "Test order for shopkeeper",
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      const { data: order, error: orderError } = await SupabaseDB.createOrder(testOrderData);
      
      if (orderError) {
        setResults({ error: `Order creation failed: ${orderError.message}` });
        return;
      }

      // Get products for this shop
      const { data: products, error: productsError } = await SupabaseDB.supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .limit(1);

      if (productsError || !products || products.length === 0) {
        setResults({ 
          error: 'No products found for this shop',
          suggestion: 'Add products first'
        });
        return;
      }

      // Create order item
      const testItemData = {
        order_id: order.id,
        product_id: products[0].id,
        quantity: 1,
        price: 100.00,
        approval_status: 'PENDING'
      };

      const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(testItemData);

      setResults({
        success: true,
        order: order,
        orderItem: orderItem,
        message: 'Test order created successfully!'
      });

      toast({
        title: "Test Order Created! 🎉",
        description: "Check the shopkeeper orders page now.",
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
          <CardTitle>Debug Shopkeeper Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={debugShopkeeperOrders} disabled={loading}>
              {loading ? 'Debugging...' : 'Debug Orders Issue'}
            </Button>
            <Button onClick={createTestOrderForShop} disabled={loading} variant="outline">
              {loading ? 'Creating...' : 'Create Test Order'}
            </Button>
          </div>

          {results && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Debug Results:</h3>
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