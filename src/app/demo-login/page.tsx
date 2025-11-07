'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Store, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function DemoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get shops from localStorage
      const shops = JSON.parse(localStorage.getItem('shops') || '[]');
      
      // Check credentials for different shopkeepers
      if (email === 'rc@shopkeeper.com' && password === 'rc123456') {
        // RC Shopkeeper
        const rcShop = shops.find((shop: any) => shop.name === 'RC');
        
        if (rcShop) {
          localStorage.setItem('userRole', 'shopkeeper');
          localStorage.setItem('currentUserId', 'shopkeeper-rc');
          localStorage.setItem('currentShopId', rcShop.id);
          localStorage.setItem('shopStatus', 'approved');
          localStorage.setItem('isLoggedIn', 'true');
          
          toast({
            title: "Login Successful!",
            description: "Welcome to RC Shop Dashboard",
          });
          router.push('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Shop Not Found",
            description: "RC shop not found. Please create the shop first.",
          });
        }
      } else if (email === 'kala@shopkeeper.com' && password === 'kala123456') {
        // Kala Shopkeeper
        const kalaShop = shops.find((shop: any) => shop.name === 'Kala Store');
        
        if (kalaShop) {
          localStorage.setItem('userRole', 'shopkeeper');
          localStorage.setItem('currentUserId', 'shopkeeper-kala');
          localStorage.setItem('currentShopId', kalaShop.id);
          localStorage.setItem('shopStatus', 'approved');
          localStorage.setItem('isLoggedIn', 'true');
          
          toast({
            title: "Login Successful!",
            description: "Welcome to Kala Store Dashboard",
          });
          router.push('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Shop Not Found",
            description: "Kala Store not found. Please create the shop first.",
          });
        }
      } else if (email === 'kirangeneral@example.com' && password === 'kiran123') {
        // Kiran General Store Shopkeeper
        const kiranShop = shops.find((shop: any) => shop.name === 'Kiran General Store');
        
        if (kiranShop) {
          localStorage.setItem('userRole', 'shopkeeper');
          localStorage.setItem('currentUserId', 'owner-1');
          localStorage.setItem('currentShopId', kiranShop.id);
          localStorage.setItem('shopStatus', 'approved');
          localStorage.setItem('isLoggedIn', 'true');
          
          toast({
            title: "Login Successful!",
            description: "Welcome to Kiran General Store Dashboard",
          });
          router.push('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Shop Not Found",
            description: "Kiran General Store not found.",
          });
        }
      } else {
        // Check if it's a dynamically created shopkeeper
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.role === 'shopkeeper');
        
        if (user && user.password === password) {
          // Find the shop for this shopkeeper
          const shops = JSON.parse(localStorage.getItem('shops') || '[]');
          const shop = shops.find((s: any) => s.id === user.shopId);
          
          if (shop && shop.status === 'approved') {
            localStorage.setItem('userRole', 'shopkeeper');
            localStorage.setItem('currentUserId', user.id);
            localStorage.setItem('currentShopId', shop.id);
            localStorage.setItem('shopStatus', 'approved');
            localStorage.setItem('shopRegistrationId', user.id); // Set registration ID
            localStorage.setItem('isLoggedIn', 'true');
            
            toast({
              title: "Login Successful!",
              description: `Welcome to ${shop.name} Dashboard`,
            });
            router.push('/dashboard');
          } else if (shop && shop.status !== 'approved') {
            toast({
              variant: "destructive",
              title: "Shop Not Approved",
              description: "Your shop registration is still under review. Please wait for admin approval.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Shop Not Found",
              description: "Associated shop not found. Please contact support.",
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Credentials",
            description: "Please check your email and password.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An error occurred during login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    // Cycle through different shopkeeper credentials
    const credentials = [
      { email: 'rc@shopkeeper.com', password: 'rc123456' },
      { email: 'kala@shopkeeper.com', password: 'kala123456' },
      { email: 'kirangeneral@example.com', password: 'kiran123' }
    ];
    
    const currentIndex = credentials.findIndex(c => c.email === email);
    const nextIndex = (currentIndex + 1) % credentials.length;
    const nextCreds = credentials[nextIndex];
    
    setEmail(nextCreds.email);
    setPassword(nextCreds.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Shopkeeper Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your shop
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Demo Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Available Shopkeeper Credentials:</strong><br />
                <div className="mt-2 space-y-1 text-sm">
                  <div><strong>RC Store:</strong> rc@shopkeeper.com / rc123456</div>
                  <div><strong>Kala Store:</strong> kala@shopkeeper.com / kala123456</div>
                  <div><strong>Kiran General Store:</strong> kirangeneral@example.com / kiran123</div>
                </div>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillDemoCredentials}
                  className="flex-1"
                >
                  Fill Demo Credentials
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  onClick={() => router.push('/create-shop')}
                  className="p-0 h-auto"
                >
                  Create Shop
                </Button>
              </p>
              <p className="text-sm text-gray-600">
                Want to register as a customer?{' '}
                <Button
                  variant="link"
                  onClick={() => router.push('/customer-registration')}
                  className="p-0 h-auto"
                >
                  Customer Registration
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Continue as Customer (No Login Required)
          </Button>
        </div>
      </div>
    </div>
  );
}
