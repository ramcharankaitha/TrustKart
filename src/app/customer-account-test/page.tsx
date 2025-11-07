'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';
import { useToast } from '@/hooks/use-toast';

export default function CustomerAccountTestPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const testCustomerCreation = async () => {
    if (!formData.email || !formData.name || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Create customer account
      addResult('1. Creating Customer Account', {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: 'customer'
      });

      const userResult = await LoginDatabasePlugin.createUserAccount({
        email: formData.email,
        name: formData.name,
        role: 'customer',
        phone: formData.phone,
        address: '',
        password: formData.password,
      } as any);

      addResult('2. Account Creation Result', userResult);

      if (userResult.success && userResult.user) {
        // Test 2: Test login with created account
        addResult('3. Testing Login with Created Account', {
          email: formData.email,
          password: '***hidden***'
        });

        const authResult = await LoginDatabasePlugin.authenticateUser(
          formData.email,
          formData.password,
          'customer'
        );

        addResult('4. Login Test Result', authResult);

        if (authResult.success) {
          toast({
            title: "✅ Test Successful!",
            description: "Customer account created and login working perfectly!",
          });
        } else {
          toast({
            variant: "destructive",
            title: "⚠️ Partial Success",
            description: "Account created but login failed. Check the results below.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "❌ Test Failed",
          description: "Account creation failed. Check the results below.",
        });
      }

    } catch (error) {
      addResult('Error', { error: error.message });
      toast({
        variant: "destructive",
        title: "Test Error",
        description: error.message || "An error occurred during testing.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Customer Account Creation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <Button 
            onClick={testCustomerCreation} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Account Creation...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Test Customer Account Creation
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-sm">{result.test}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                    <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
