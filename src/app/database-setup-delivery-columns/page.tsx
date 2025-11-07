'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Copy, Database, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseSetupDeliveryColumnsPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- ADD DELIVERY LOCATION COLUMNS
-- This script adds pickup and delivery location fields to the deliveries table

DO $$ 
BEGIN
    -- Add pickup location (shopkeeper address)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added pickup_latitude column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added pickup_longitude column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_address') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_address TEXT;
        RAISE NOTICE 'Added pickup_address column';
    END IF;
    
    -- Add delivery location (customer address coordinates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added delivery_latitude column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added delivery_longitude column';
    END IF;
END $$;

SELECT 'Delivery location columns added successfully!' as status;`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sqlScript);
    toast({
      title: "SQL Script Copied!",
      description: "Paste it in Supabase SQL Editor to add the missing columns.",
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
            Fix Missing Delivery Columns
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Add missing location columns to the deliveries table. The error "column deliveries.pickup_address does not exist"
            occurs because these columns haven't been added yet.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Fixed (Temporary)</AlertTitle>
          <AlertDescription>
            The API has been updated to work without these columns, but you should add them for full functionality.
            Location fields are needed for proper navigation and delivery tracking.
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
              <AlertTitle>Columns Being Added</AlertTitle>
              <AlertDescription className="space-y-1">
                <div><strong>pickup_address</strong> - Shopkeeper's address for pickup</div>
                <div><strong>pickup_latitude</strong> - Shopkeeper's latitude</div>
                <div><strong>pickup_longitude</strong> - Shopkeeper's longitude</div>
                <div><strong>delivery_latitude</strong> - Customer's delivery latitude</div>
                <div><strong>delivery_longitude</strong> - Customer's delivery longitude</div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

