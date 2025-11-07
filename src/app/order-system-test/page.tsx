'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB } from '@/lib/supabase-db';

export default function OrderSystemTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testOrderCreation = async () => {
    setIsLoading(true);
    setTestResult('Testing order creation...\n');

    try {
      // Test order creation
      const orderData = {
        customer_id: 'test-customer-id',
        shop_id: 'test-shop-id',
        total_amount: 100.00,
        subtotal: 95.00,
        delivery_address: 'Test Address',
        delivery_phone: '1234567890',
        notes: 'Test order',
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      console.log('🔍 Testing order creation with:', orderData);
      
      const { data: order, error: orderError } = await SupabaseDB.createOrder(orderData);
      
      if (orderError) {
        setTestResult(prev => prev + `❌ Order creation failed: ${JSON.stringify(orderError, null, 2)}\n`);
        console.error('❌ Order creation error:', orderError);
      } else {
        setTestResult(prev => prev + `✅ Order created successfully: ${JSON.stringify(order, null, 2)}\n`);
        console.log('✅ Order created:', order);

        // Test order item creation
        const orderItemData = {
          order_id: order.id,
          product_id: 'test-product-id',
          quantity: 2,
          price: 50.00,
          approval_status: 'PENDING'
        };

        console.log('🔍 Testing order item creation with:', orderItemData);
        
        const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(orderItemData);
        
        if (itemError) {
          setTestResult(prev => prev + `❌ Order item creation failed: ${JSON.stringify(itemError, null, 2)}\n`);
          console.error('❌ Order item creation error:', itemError);
        } else {
          setTestResult(prev => prev + `✅ Order item created successfully: ${JSON.stringify(orderItem, null, 2)}\n`);
          console.log('✅ Order item created:', orderItem);
        }
      }

    } catch (error) {
      setTestResult(prev => prev + `❌ Test failed with exception: ${JSON.stringify(error, null, 2)}\n`);
      console.error('❌ Test exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Order System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testOrderCreation} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Order Creation'}
          </Button>
          
          {testResult && (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. First run the SQL script: <code>setup-orders-system.sql</code></li>
              <li>2. Then click "Test Order Creation" above</li>
              <li>3. Check the console and results for any errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
