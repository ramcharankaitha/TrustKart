'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Copy, Database, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseSetupForeignKeysPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const sqlScript = `-- FIX ORDERS-USERS RELATIONSHIP
-- This script adds proper foreign key relationships between orders and users/shops
-- Run this in Supabase SQL Editor

-- Add foreign key constraint: orders.customer_id -> users.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'customer_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_customer_id 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key: orders.customer_id -> users.id';
    END IF;
END $$;

-- Add foreign key constraint: orders.shop_id -> shops.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'shop_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_shop_id 
        FOREIGN KEY (shop_id) 
        REFERENCES shops(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key: orders.shop_id -> shops.id';
    END IF;
END $$;

-- Add foreign key constraint: deliveries.order_id -> orders.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'deliveries' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'order_id'
    ) THEN
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_order_id 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key: deliveries.order_id -> orders.id';
    END IF;
END $$;

-- Add foreign key constraint: deliveries.delivery_agent_id -> delivery_agents.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'deliveries' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'delivery_agent_id'
    ) THEN
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_delivery_agent_id 
        FOREIGN KEY (delivery_agent_id) 
        REFERENCES delivery_agents(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key: deliveries.delivery_agent_id -> delivery_agents.id';
    END IF;
END $$;

SELECT 'Foreign key relationships added successfully!' as status;`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sqlScript);
    toast({
      title: "SQL Script Copied!",
      description: "Paste it in Supabase SQL Editor to add foreign key relationships.",
    });
  };

  const openSupabaseSQL = () => {
    window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Fix Database Relationships
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Add foreign key relationships between orders, users, shops, and deliveries tables.
            This is required for Supabase to properly join tables in queries.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Supabase requires explicit foreign key relationships to be defined in the database
            for nested queries to work. The error "Could not find a relationship between 'orders' and 'users'"
            occurs because these relationships are missing.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SQL Script
            </CardTitle>
            <CardDescription>
              Copy this script and run it in your Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {sqlScript}
              </pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCopyScript} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL Script
              </Button>
              <Button onClick={openSupabaseSQL} variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase SQL Editor
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Fix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Copy the SQL script above</li>
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to SQL Editor</li>
              <li>Paste the script and run it</li>
              <li>Refresh your application</li>
            </ol>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>After Running the Script</AlertTitle>
              <AlertDescription>
                The foreign key relationships will be established, and Supabase will be able to
                properly join the orders table with users and shops tables in nested queries.
                You may need to refresh your Supabase schema cache.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

