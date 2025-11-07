'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDB } from '@/lib/supabase-db';

export default function OrderDebugPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testOrderCreation = async () => {
    setIsLoading(true);
    setTestResult('Testing order creation...\n');

    try {
      // Test order creation with real data
      const orderData = {
        customer_id: 'test-customer-debug',
        shop_id: 'test-shop-debug',
        total_amount: 105.00,
        subtotal: 100.00,
        delivery_address: 'Test Address, Test City',
        delivery_phone: '1234567890',
        notes: 'Debug test order',
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      console.log('🔍 Testing order creation with:', orderData);
      setTestResult(prev => prev + `Testing with data: ${JSON.stringify(orderData, null, 2)}\n`);
      
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
          product_id: 'test-product-debug',
          quantity: 2,
          price: 50.00,
          approval_status: 'PENDING'
        };

        console.log('🔍 Testing order item creation with:', orderItemData);
        setTestResult(prev => prev + `Testing order item: ${JSON.stringify(orderItemData, null, 2)}\n`);
        
        const { data: orderItem, error: itemError } = await SupabaseDB.createOrderItem(orderItemData);
        
        if (itemError) {
          setTestResult(prev => prev + `❌ Order item creation failed: ${JSON.stringify(itemError, null, 2)}\n`);
          console.error('❌ Order item creation error:', itemError);
        } else {
          setTestResult(prev => prev + `✅ Order item created successfully: ${JSON.stringify(orderItem, null, 2)}\n`);
          console.log('✅ Order item created:', orderItem);
        }

        // Clean up test data
        setTestResult(prev => prev + `Cleaning up test data...\n`);
        // Note: In production, you'd want to clean up the test data
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
          <CardTitle>Order System Debug</CardTitle>
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
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">URGENT: Run this SQL first!</h3>
            <p className="text-red-700 text-sm mb-2">
              Copy and paste this EXACT code into your Supabase SQL Editor:
            </p>
            <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
{`-- COMPLETE ORDER SYSTEM FIX
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
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

CREATE TABLE order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || substr(md5(random()::text), 1, 8),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    approval_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'SUCCESS: Order system is ready!' as status;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
