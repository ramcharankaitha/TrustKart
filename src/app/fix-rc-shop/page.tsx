'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FixRCShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [rcShopAdded, setRcShopAdded] = useState(false);

  const addRCShopToLocalStorage = () => {
    setIsAdding(true);
    
    try {
      // Get existing shops
      const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
      
      // Check if RC shop already exists
      const rcShopExists = existingShops.some(shop => shop.name === 'RC');
      
      if (!rcShopExists) {
        // Create RC shop
        const rcShop = {
          id: `shop-rc-${Date.now()}`,
          name: 'RC',
          location: 'Mumbai, Maharashtra',
          imageUrl: 'https://picsum.photos/seed/rc-shop/600/200',
          imageHint: 'RC shop image',
          address: '456 Business District, Central Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          coordinates: {
            latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
            longitude: 72.8777 + (Math.random() - 0.5) * 0.1
          },
          businessType: 'grocery',
          description: 'Premium grocery store with fresh products and excellent service',
          phone: '+91 9876543211',
          email: 'rc@shopkeeper.com',
          status: 'approved',
          shopkeeperId: 'shopkeeper-rc',
          ownerId: 'shopkeeper-rc',
          registrationDate: new Date(),
          approvalDate: new Date(),
          documents: []
        };
        
        // Add RC shop to existing shops
        existingShops.push(rcShop);
        localStorage.setItem('shops', JSON.stringify(existingShops));
        
        // Dispatch event to refresh customer dashboard
        window.dispatchEvent(new CustomEvent('shopStatusChanged'));
        
        setRcShopAdded(true);
        
        toast({
          title: "RC Shop Added!",
          description: "RC shop is now visible on the customer dashboard.",
        });
        
        console.log('RC shop added to localStorage:', rcShop);
      } else {
        setRcShopAdded(true);
        toast({
          title: "RC Shop Already Exists",
          description: "RC shop is already in the system.",
        });
      }
    } catch (error) {
      console.error('Error adding RC shop:', error);
      toast({
        variant: "destructive",
        title: "Error Adding RC Shop",
        description: "There was an error adding the RC shop.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    // Automatically add RC shop when page loads
    addRCShopToLocalStorage();
  }, []);

  return (
    <div className="container mx-auto my-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Fix RC Shop Visibility</h1>
          <p className="text-muted-foreground">
            This page ensures the RC shop is properly added to the customer dashboard.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              RC Shop Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rcShopAdded ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">RC Shop is Ready!</h3>
                  <p className="text-green-600 text-sm">
                    The RC shop has been added and is now visible to customers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <RefreshCw className={`h-6 w-6 text-yellow-600 ${isAdding ? 'animate-spin' : ''}`} />
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    {isAdding ? 'Adding RC Shop...' : 'Preparing RC Shop'}
                  </h3>
                  <p className="text-yellow-600 text-sm">
                    {isAdding ? 'Please wait while we add the RC shop to the system.' : 'Click the button below to add the RC shop.'}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">RC Shop Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">RC</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">Grocery Store</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">Mumbai, Maharashtra</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-600 ml-2">Approved</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={addRCShopToLocalStorage}
                disabled={isAdding}
                className="flex-1"
              >
                {isAdding ? 'Adding...' : 'Add RC Shop Again'}
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Go to Customer Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            After adding the RC shop, refresh the customer dashboard to see it in the shop list.
          </p>
        </div>
      </div>
    </div>
  );
}
