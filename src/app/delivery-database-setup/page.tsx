'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Truck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeliveryDatabaseSetupPage() {
  const [loading, setLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState<{
    delivery_agents: string;
    deliveries: string;
  } | null>(null);
  const { toast } = useToast();

  const checkTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/setup-delivery-tables');
      const result = await response.json();
      
      if (result.success) {
        setTableStatus(result.tables);
        toast({
          title: "Database Check Complete",
          description: "Checked delivery agent tables status",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to check database tables",
        });
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check database tables",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/setup-delivery-tables', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Tables Created Successfully!",
          description: "Delivery agent tables have been created in your database",
        });
        // Refresh table status
        await checkTables();
      } else {
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: result.error || "Failed to create database tables",
        });
      }
    } catch (error) {
      console.error('Error creating tables:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create database tables",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Exists':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Not found':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Exists':
        return 'bg-green-100 text-green-800';
      case 'Not found':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-orange-600" />
            Delivery Agent Database Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Set up the database tables required for the delivery agent module
          </p>
        </div>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Setup Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to set up the delivery agent database tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 dark:text-white">Method 1: Using this page (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Click "Check Database Status" to see current table status</li>
                <li>If tables don't exist, click "Create Tables" to create them automatically</li>
                <li>Verify the tables were created successfully</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 dark:text-white">Method 2: Manual SQL execution</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Open your Supabase dashboard</li>
                <li>Go to SQL Editor</li>
                <li>Copy and paste the contents of <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">DELIVERY-AGENT-SUPABASE-SETUP.sql</code></li>
                <li>Execute the SQL script</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Table Status
              </CardTitle>
              <CardDescription>
                Current status of delivery agent tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tableStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">delivery_agents</span>
                    <Badge className={`${getStatusColor(tableStatus.delivery_agents)} flex items-center gap-1`}>
                      {getStatusIcon(tableStatus.delivery_agents)}
                      {tableStatus.delivery_agents}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">deliveries</span>
                    <Badge className={`${getStatusColor(tableStatus.deliveries)} flex items-center gap-1`}>
                      {getStatusIcon(tableStatus.deliveries)}
                      {tableStatus.deliveries}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Click "Check Database Status" to see table status
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Manage your delivery agent database tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkTables}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Check Database Status
                  </>
                )}
              </Button>

              <Button
                onClick={createTables}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Create Tables
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Required Tables Info */}
        <Card>
          <CardHeader>
            <CardTitle>Required Database Tables</CardTitle>
            <CardDescription>
              The following tables are required for the delivery agent module
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">delivery_agents</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Stores delivery agent information including personal details, vehicle information, and status.
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fields: id, email, name, password, phone, vehicle_type, vehicle_number, license_number, aadhaar_number, address, status, is_available, rating, total_deliveries, created_at, updated_at
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">deliveries</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Tracks delivery assignments and their status throughout the delivery process.
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fields: id, order_id, delivery_agent_id, status, assigned_at, picked_up_at, delivered_at, delivery_address, delivery_phone, notes, rating, created_at, updated_at
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              After setting up the database tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-300">
                1. Test the delivery agent registration at <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">/delivery-agent-registration</code>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                2. Login as a delivery agent at <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">/login</code>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                3. Access the delivery agent dashboard at <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">/dashboard</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
