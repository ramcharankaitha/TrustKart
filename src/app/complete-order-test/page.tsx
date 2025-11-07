'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB } from '@/lib/supabase-db';

export default function OrderSystemTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testCompleteSystem = async () => {
    setIsLoading(true);
    setTestResult('Testing complete order system...\n');

    try {
      // Test 1: Create Order
      setTestResult(prev => prev + 'Test 1: Creating order...\n');
      const orderData = {
        customer_id: 'test-customer-system',
        shop_id: 'test-shop-system',
        total_amount: 105.00,
        subtotal: 100.00,
        delivery_address: 'Test Address, Test City',
        delivery_phone: '1234567890',
        notes: 'System test order',
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      const { data: order, error: orderError } = await SupabaseDB.createOrder(orderData);
      
      if (orderError) {
        setTestResult(prev => prev + `❌ Order creation failed: ${JSON.stringify(orderError, null, 2)}\n`);
        return;
      }

      setTestResult(prev => prev + `✅ Order created: ${order.id}\n`);

      // Test 2: Create Order Item
      setTestResult(prev => prev + 'Test 2: Creating order item...\n');
      const orderItemData = {
        order_id: order.id,
        product_id: 'test-product-system',
        quantity: 2,
        price: 50.00,
        approval_status: 'PENDING'
      };

      const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(orderItemData);
      
      if (itemError) {
        setTestResult(prev => prev + `❌ Order item creation failed: ${JSON.stringify(itemError, null, 2)}\n`);
        return;
      }

      setTestResult(prev => prev + `✅ Order item created: ${orderItem.id}\n`);

      // Test 3: Get Orders by Shop
      setTestResult(prev => prev + 'Test 3: Fetching orders by shop...\n');
      const { data: orders, error: ordersError } = await SupabaseDB.getOrdersByShop('test-shop-system');
      
      if (ordersError) {
        setTestResult(prev => prev + `❌ Get orders by shop failed: ${JSON.stringify(ordersError, null, 2)}\n`);
        return;
      }

      setTestResult(prev => prev + `✅ Found ${orders.length} orders for shop\n`);

      // Test 4: Get Order by ID
      setTestResult(prev => prev + 'Test 4: Fetching order by ID...\n');
      const { data: orderById, error: orderByIdError } = await SupabaseDB.getOrderById(order.id);
      
      if (orderByIdError) {
        setTestResult(prev => prev + `❌ Get order by ID failed: ${JSON.stringify(orderByIdError, null, 2)}\n`);
        return;
      }

      setTestResult(prev => prev + `✅ Order by ID retrieved: ${orderById.id}\n`);

      // Test 5: Update Order Status
      setTestResult(prev => prev + 'Test 5: Updating order status...\n');
      const { data: updatedOrder, error: updateError } = await SupabaseDB.updateOrderStatus(order.id, 'APPROVED', 'Test approval');
      
      if (updateError) {
        setTestResult(prev => prev + `❌ Update order status failed: ${JSON.stringify(updateError, null, 2)}\n`);
        return;
      }

      setTestResult(prev => prev + `✅ Order status updated to: ${updatedOrder.status}\n`);

      setTestResult(prev => prev + '\n🎉 ALL TESTS PASSED! Order system is working perfectly!\n');

    } catch (error) {
      setTestResult(prev => prev + `❌ Test failed with exception: ${JSON.stringify(error, null, 2)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Complete Order System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testCompleteSystem} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Complete Order System'}
          </Button>
          
          {testResult && (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Before Testing:</h3>
            <p className="text-green-700 text-sm mb-2">
              Run this SQL script in your Supabase SQL Editor first:
            </p>
            <pre className="text-xs bg-green-100 p-2 rounded overflow-x-auto">
{`-- COMPLETE FIX: Ensure All Tables Exist and Work
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT 'order_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING',
    delivery_address TEXT,
    delivery_phone TEXT,
    payment_method TEXT,
    payment_status TEXT,
    notes TEXT,
    request_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || substr(md5(random()::text), 1, 8),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    approval_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'SUCCESS: All tables are ready!' as status;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
