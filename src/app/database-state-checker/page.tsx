'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-db';

export default function DatabaseStateChecker() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabaseState = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🔍 Checking database state...');

      // Check if orders table exists and its structure
      const { data: ordersTable, error: ordersTableError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'orders');

      console.log('Orders table structure:', { ordersTable, ordersTableError });

      // Check if order_items table exists and its structure
      const { data: orderItemsTable, error: orderItemsTableError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'order_items');

      console.log('Order items table structure:', { orderItemsTable, orderItemsTableError });

      // Try to query orders table directly
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);

      console.log('Orders data:', { ordersData, ordersError });

      // Try to query order_items table directly
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(5);

      console.log('Order items data:', { orderItemsData, orderItemsError });

      // Check all tables in the database
      const { data: allTables, error: allTablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      console.log('All tables:', { allTables, allTablesError });

      setResults({
        ordersTableStructure: ordersTable,
        orderItemsTableStructure: orderItemsTable,
        ordersData: ordersData,
        ordersError: ordersError,
        orderItemsData: orderItemsData,
        orderItemsError: orderItemsError,
        allTables: allTables,
        summary: {
          ordersTableExists: !ordersTableError && ordersTable && ordersTable.length > 0,
          orderItemsTableExists: !orderItemsTableError && orderItemsTable && orderItemsTable.length > 0,
          ordersQueryWorks: !ordersError,
          orderItemsQueryWorks: !orderItemsError,
          ordersCount: ordersData?.length || 0,
          orderItemsCount: orderItemsData?.length || 0
        }
      });

    } catch (error) {
      console.error('❌ Database check error:', error);
      setResults({ 
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const fixDatabaseStructure = async () => {
    setLoading(true);
    try {
      console.log('🔧 Attempting to fix database structure...');

      // First, let's see what the current structure looks like
      const { data: currentOrders, error: currentOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

      console.log('Current orders structure:', { currentOrders, currentOrdersError });

      if (currentOrdersError) {
        // Table doesn't exist or has issues
        setResults({
          error: 'Orders table has issues',
          suggestion: 'Run the fix-orders-table-complete.sql script',
          currentError: currentOrdersError.message
        });
        return;
      }

      // Check if we have the right columns
      const sampleOrder = currentOrders?.[0];
      if (sampleOrder) {
        const hasCustomerId = 'customer_id' in sampleOrder || 'customerId' in sampleOrder;
        const hasShopId = 'shop_id' in sampleOrder || 'shopId' in sampleOrder;
        const hasSubtotal = 'subtotal' in sampleOrder;

        setResults({
          currentStructure: sampleOrder,
          analysis: {
            hasCustomerId,
            hasShopId,
            hasSubtotal,
            customerIdColumn: 'customer_id' in sampleOrder ? 'customer_id' : 'customerId',
            shopIdColumn: 'shop_id' in sampleOrder ? 'shop_id' : 'shopId'
          },
          recommendation: !hasCustomerId || !hasShopId || !hasSubtotal 
            ? 'Database structure is incorrect. Run the fix script.'
            : 'Database structure looks correct. Issue might be elsewhere.'
        });
      } else {
        setResults({
          message: 'No orders found in database',
          suggestion: 'Create a test order to verify the system works'
        });
      }

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
          <CardTitle>Database State Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkDatabaseState} disabled={loading}>
              {loading ? 'Checking...' : 'Check Database State'}
            </Button>
            <Button onClick={fixDatabaseStructure} disabled={loading} variant="outline">
              {loading ? 'Analyzing...' : 'Analyze Structure'}
            </Button>
          </div>

          {results && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Database Analysis:</h3>
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