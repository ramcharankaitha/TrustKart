'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertTriangle, Copy, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseSetupAddressesPage() {
  const [loading, setLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState<'checking' | 'exists' | 'not-exists' | null>(null);
  const [showScript, setShowScript] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- CUSTOMER ADDRESSES SETUP
-- This script creates a table for managing multiple customer addresses

-- ==============================================
-- 1. CREATE CUSTOMER_ADDRESSES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT 'addr_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    label TEXT,
    full_name TEXT,
    phone TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_location ON customer_addresses(latitude, longitude);

-- ==============================================
-- 3. CREATE FUNCTION TO ENSURE ONLY ONE DEFAULT ADDRESS
-- ==============================================
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses
        SET is_default = FALSE
        WHERE customer_id = NEW.customer_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle default address
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON customer_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Customer addresses table created successfully!' as status;`;

  const checkTableStatus = async () => {
    setLoading(true);
    setTableStatus('checking');

    try {
      const response = await fetch('/api/setup-customer-addresses');
      const result = await response.json();

      if (result.success && result.exists) {
        setTableStatus('exists');
        toast({
          title: 'Table Exists',
          description: 'Customer addresses table is ready!',
        });
      } else {
        setTableStatus('not-exists');
        toast({
          variant: 'destructive',
          title: 'Table Not Found',
          description: 'The customer_addresses table needs to be created.',
        });
      }
    } catch (error: any) {
      console.error('Error checking table:', error);
      setTableStatus('not-exists');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not check table status. Please try running the SQL script manually.',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      toast({
        title: 'Copied!',
        description: 'SQL script copied to clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy to clipboard. Please select and copy manually.',
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Customer Addresses Database Setup
          </CardTitle>
          <CardDescription>
            Set up the customer_addresses table to enable address management functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error Fix:</strong> The error "Could not find the table 'public.customer_addresses'" occurs because the table hasn't been created yet. Follow the steps below to fix it.
            </AlertDescription>
          </Alert>

          {/* Check Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={checkTableStatus} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Check Table Status
                  </>
                )}
              </Button>

              {tableStatus === 'exists' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Table exists and is ready!</span>
                </div>
              )}

              {tableStatus === 'not-exists' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Table does not exist</span>
                </div>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Setup Instructions</h3>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Step 1: Open Supabase Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                Go to your Supabase project dashboard and navigate to the SQL Editor.
              </p>

              <h4 className="font-medium text-sm">Step 2: Run the SQL Script</h4>
              <p className="text-sm text-muted-foreground">
                Copy the SQL script below and paste it into the SQL Editor, then execute it.
              </p>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowScript(!showScript)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  {showScript ? 'Hide SQL Script' : 'Show SQL Script'}
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Script
                </Button>
              </div>

              {showScript && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border">
                  <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                    {sqlScript}
                  </pre>
                </div>
              )}

              <h4 className="font-medium text-sm">Step 3: Verify Setup</h4>
              <p className="text-sm text-muted-foreground">
                After running the script, click "Check Table Status" above to verify the table was created successfully.
              </p>

              <h4 className="font-medium text-sm">Step 4: Test Address Management</h4>
              <p className="text-sm text-muted-foreground">
                Go to <strong>/dashboard/addresses</strong> and try adding your first address!
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('/dashboard/addresses', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Go to Addresses Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

