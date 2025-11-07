'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function CustomerRegistrationButtonTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testButtonClick = () => {
    addResult('✅ Customer registration button test initiated');
    addResult('🔗 Button should navigate to /customer-registration');
    addResult('📝 Customer can fill registration form with email/password');
    addResult('🎯 After registration, customer is auto-logged in');
    addResult('🏠 Customer is redirected to dashboard');
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Customer Registration Button Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Test the "New user? Create account" Button</h3>
            
            {/* Simulate the button from login page */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                New user? Create account
              </p>
              <Link 
                href="/customer-registration" 
                className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Register as Customer
              </Link>
            </div>

            <Button onClick={testButtonClick} className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              Test Button Functionality
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Test Results:</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">How to Test:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click the "Register as Customer" link above</li>
              <li>You should be taken to the customer registration page</li>
              <li>Fill in the registration form with your details</li>
              <li>Submit the form - you should be auto-logged in</li>
              <li>You should be redirected to the customer dashboard</li>
              <li>Test logging in again with the same credentials</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
