'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DebugRegistrationError() {
  const [testData, setTestData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    aadhaarNumber: '123456789012',
    password: 'test123'
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing registration with data:', testData);
      
      // Test Supabase client initialization
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      console.log('🔍 Environment check:');
      console.log('🔍 Supabase URL:', supabaseUrl);
      console.log('🔍 Supabase Key exists:', !!supabaseAnonKey);
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase client created');
      
      // Test database connection
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      console.log('🔍 Database connection test:', { testData, testError });
      
      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      // Test user creation with detailed logging
      const userData = {
        email: testData.email,
        name: testData.name,
        role: 'shopkeeper',
        phone: testData.phone,
        dateOfBirth: '1990-01-01',
        aadhaarNumber: testData.aadhaarNumber,
        password: testData.password
      };
      
      console.log('🔍 User data to insert:', userData);
      
      // Hash password
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      const userInsertData = {
        email: userData.email,
        name: userData.name,
        role: userData.role.toUpperCase(),
        password_hash: passwordHash,
        is_active: true,
        phone: userData.phone,
        date_of_birth: userData.dateOfBirth,
        aadhaar_number: userData.aadhaarNumber
      };
      
      console.log('🔍 Insert data:', userInsertData);
      
      const { data: user, error } = await supabase
        .from('users')
        .insert([userInsertData])
        .select()
        .single();
        
      console.log('🔍 Insert result:', { user, error });
      
      if (error) {
        console.error('❌ Detailed error analysis:');
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error constructor:', error.constructor.name);
        console.error('❌ Error keys:', Object.keys(error));
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Full error:', error);
        
        setResult({
          success: false,
          error: error.message || 'Unknown error',
          details: {
            type: typeof error,
            constructor: error.constructor.name,
            keys: Object.keys(error),
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        });
      } else {
        console.log('✅ User created successfully:', user);
        setResult({
          success: true,
          user: user,
          message: 'User created successfully!'
        });
      }
      
    } catch (error: any) {
      console.error('❌ Test error:', error);
      setResult({
        success: false,
        error: error.message || 'Test failed',
        details: {
          type: typeof error,
          message: error.message,
          stack: error.stack
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Debug Registration Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Error:</strong> "❌ Database error: {}" - Empty error object
              <br />
              <strong>Purpose:</strong> This test will help identify the exact cause of the registration failure.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={testData.name}
                onChange={(e) => setTestData({...testData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData({...testData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={testData.phone}
                onChange={(e) => setTestData({...testData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                value={testData.aadhaarNumber}
                onChange={(e) => setTestData({...testData, aadhaarNumber: e.target.value})}
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={testData.password}
                onChange={(e) => setTestData({...testData, password: e.target.value})}
              />
            </div>
          </div>

          <Button 
            onClick={testRegistration} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Registration'}
          </Button>

          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{result.success ? 'Success!' : 'Error:'}</strong>
                  <br />
                  {result.success ? result.message : result.error}
                </AlertDescription>
              </Alert>

              {result.details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detailed Error Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What This Test Does:</h4>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Checks Supabase environment variables</li>
              <li>Tests database connection</li>
              <li>Attempts user creation with detailed logging</li>
              <li>Captures and displays exact error information</li>
              <li>Shows error type, constructor, and all properties</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/shopkeeper-registration'} variant="outline">
              Go to Registration
            </Button>
            <Button onClick={() => window.location.href = '/fix-aadhaar-column'} variant="outline">
              Fix Aadhaar Column
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
