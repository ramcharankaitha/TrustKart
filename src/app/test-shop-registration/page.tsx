'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Store, User, Mail, Key, MapPin, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestNewShopRegistration() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createTestShop = () => {
    setIsCreating(true);
    
    try {
      // Create a test shop registration request
      const testShopRequest = {
        id: `reg-${Date.now()}-test`,
        shopkeeperId: `shopkeeper-${Date.now()}-test`,
        shopDetails: {
          shopName: 'Test Grocery Store',
          address: '123 Test Street, Test Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '+91 98765 43299',
          email: 'test@shopkeeper.com',
          businessType: 'grocery',
          description: 'Test grocery store for demonstration'
        },
        documents: [
          {
            id: 'doc-test-1',
            type: 'business_license',
            name: 'Test Business License.pdf',
            url: 'data:application/pdf;base64,test-content',
            uploadedAt: new Date(),
            fileSize: 1024,
            fileType: 'application/pdf'
          }
        ],
        status: 'pending',
        submittedAt: new Date()
      };

      // Store registration request
      const existingRequests = JSON.parse(localStorage.getItem('shopRegistrationRequests') || '[]');
      existingRequests.push(testShopRequest);
      localStorage.setItem('shopRegistrationRequests', JSON.stringify(existingRequests));

      toast({
        title: "Test Shop Registration Created!",
        description: "A test shop registration has been created. You can now approve it as an admin.",
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create test shop registration.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto my-8 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Test New Shop Registration</CardTitle>
          <p className="text-muted-foreground">
            This page demonstrates the complete shop registration and approval process.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Process Steps */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-4">Complete Registration Process:</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium">Register Shop</h4>
                <p className="text-sm text-gray-600">Fill out shop details and upload documents</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium">Admin Approval</h4>
                <p className="text-sm text-gray-600">Admin reviews and approves the registration</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium">Shop Visible</h4>
                <p className="text-sm text-gray-600">Shop becomes visible to customers</p>
              </div>
            </div>
          </div>

          {/* Test Shop Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Test Shop Details:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span>Test Grocery Store</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Location:</span>
                  <span>Mumbai, Maharashtra</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span>+91 98765 43299</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span>test@shopkeeper.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline">Grocery Store</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              onClick={createTestShop} 
              disabled={isCreating}
              className="w-full"
            >
              <Store className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Test Shop Registration'}
            </Button>
            
            <Link href="/dashboard/admin-approvals">
              <Button variant="outline" className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve as Admin
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                View as Customer
              </Button>
            </Link>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">How to Test:</h3>
            <ol className="text-sm text-green-700 space-y-1">
              <li>1. Click "Create Test Shop Registration" to create a test shop</li>
              <li>2. Go to Admin Approvals page to approve the shop</li>
              <li>3. Check the customer dashboard - the shop should now be visible</li>
              <li>4. Login as the shopkeeper using: test@shopkeeper.com / default123</li>
              <li>5. Verify that orders go to the correct shopkeeper</li>
            </ol>
          </div>

          {/* Current Shops */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Current Registered Shops:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Kiran General Store</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Reliance Fresh</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Sharma Provision Store</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Big Bazaar</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Kala Store</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>Patel Kirana Store</span>
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
