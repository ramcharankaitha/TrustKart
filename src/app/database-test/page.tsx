'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerDatabasePlugin } from '@/lib/plugins/customer-database-plugin';
import { SupabaseDB } from '@/lib/supabase-db';

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Environment variables
      const envTest = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      };
      addResult('Environment Variables', envTest);

      // Test 2: Get approved shops
      const shopsResult = await CustomerDatabasePlugin.getApprovedShops();
      addResult('Get Approved Shops', shopsResult);

      // Test 3: If we have shops, test getting products for the first shop
      if (shopsResult.success && shopsResult.shops.length > 0) {
        const firstShop = shopsResult.shops[0];
        const productsResult = await CustomerDatabasePlugin.getShopProducts(firstShop.id);
        addResult(`Get Products for Shop ${firstShop.name}`, productsResult);
      }

      // Test 4: Test database connection
      try {
        const connectionTest = await SupabaseDB.testDatabaseConnection();
        addResult('Database Connection Test', connectionTest);
      } catch (e) {
        addResult('Database Connection Test', { error: e });
      }

    } catch (error) {
      addResult('Test Suite Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="mb-4">
            {loading ? 'Running Tests...' : 'Run Database Tests'}
          </Button>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{result.test}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}