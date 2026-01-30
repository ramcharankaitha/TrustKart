'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Leaf, Shield, Store, UserIcon, ArrowRight, Eye, EyeOff, 
  Mail, Lock, UserPlus, Building2, CheckCircle, Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'shopkeeper' | 'admin' | 'delivery_agent' | 'farmer' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  
  // SIMPLIFIED: Only name field for customer signup
  const [customerName, setCustomerName] = useState('');
  
  const router = useRouter();
  const { toast } = useToast();

  const handleCustomerLogin = async () => {
    if (isSignup) {
      // SIMPLIFIED customer signup - only email, password, name
      if (!email || !password || !customerName) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields: Name, Email, and Password.",
        });
        return;
      }

      setLoading(true);
      
      try {
        console.log('Creating customer account with SIMPLIFIED data:', {
          email,
          name: customerName,
          role: 'customer'
        });

        // SIMPLIFIED: Only send basic fields that exist in database
        const userResult = await LoginDatabasePlugin.createUserAccount({
          email: email,
          name: customerName,
          role: 'customer',
          password: password,
        } as any);

        console.log('User creation result:', userResult);

        if (userResult.success && userResult.user) {
          console.log('Account created successfully!');
          
          toast({
            title: "Account Created Successfully!",
            description: `Welcome ${customerName}! Accessing customer dashboard...`,
          });
          
          router.push('/dashboard');
        } else {
          console.error('Account creation failed:', userResult.error);
          toast({
            variant: "destructive",
            title: "Signup Failed",
            description: userResult.error || "Failed to create account. Please try again.",
          });
        }
      } catch (error) {
        console.error('Signup error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during signup. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Handle customer login
      if (!email || !password) {
        toast({
          variant: "destructive",
          title: "Missing Credentials",
          description: "Please enter both email and password.",
        });
        return;
      }

      setLoading(true);
      
      try {
        const result = await LoginDatabasePlugin.authenticateUser(email, password, 'customer');
        
        if (result.success && result.user) {
          toast({
            title: "Login Successful!",
            description: "Welcome to customer dashboard",
          });
          
          router.push('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: result.error || "Invalid credentials. Please try again.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during login. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCredentialLogin = async (role: 'shopkeeper' | 'admin' | 'delivery_agent' | 'farmer') => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Credentials",
        description: "Please enter both email and password.",
      });
      return;
    }

    setLoading(true);
    
      try {
        let result;
        
        if (role === 'delivery_agent') {
          // Use delivery agent specific authentication
          const response = await fetch('/api/delivery-agents/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          const loginResult = await response.json();
          
          if (loginResult.success && loginResult.deliveryAgent) {
            // Set sessionStorage on client side
            try {
              sessionStorage.setItem('deliveryAgentSession', JSON.stringify({
                id: loginResult.deliveryAgent.id,
                email: loginResult.deliveryAgent.email,
                name: loginResult.deliveryAgent.name,
                phone: loginResult.deliveryAgent.phone,
                vehicleType: loginResult.deliveryAgent.vehicleType,
                status: loginResult.deliveryAgent.status,
                isAvailable: loginResult.deliveryAgent.isAvailable || false,
                rating: loginResult.deliveryAgent.rating || 0,
                totalDeliveries: loginResult.deliveryAgent.totalDeliveries || 0,
                loginTime: new Date().toISOString()
              }));
              console.log('Delivery agent session stored:', loginResult.deliveryAgent.name);
            } catch (error) {
              console.error('Error storing delivery agent session:', error);
            }
          }
          
          result = loginResult;
        } else if (role === 'farmer') {
          // Use farmer specific authentication
          const response = await fetch('/api/farmers/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          const loginResult = await response.json();
          
          if (loginResult.success && loginResult.farmer) {
            // Set sessionStorage on client side
            try {
              sessionStorage.setItem('farmerSession', JSON.stringify({
                id: loginResult.farmer.id,
                email: loginResult.farmer.email,
                name: loginResult.farmer.name,
                phone: loginResult.farmer.phone,
                farmName: loginResult.farmer.farmName,
                status: loginResult.farmer.status,
                isActive: loginResult.farmer.isActive || false,
                rating: loginResult.farmer.rating || 0,
                totalVegetablesSubmitted: loginResult.farmer.totalVegetablesSubmitted || 0,
                totalVegetablesApproved: loginResult.farmer.totalVegetablesApproved || 0,
                loginTime: new Date().toISOString()
              }));
              console.log('Farmer session stored:', loginResult.farmer.name);
            } catch (error) {
              console.error('Error storing farmer session:', error);
            }
          }
          
          result = loginResult;
        } else {
          // Use regular user authentication
          result = await LoginDatabasePlugin.authenticateUser(email, password, role);
        }
        
        if (result.success && (result.user || result.deliveryAgent || result.farmer)) {
          toast({
            title: "Login Successful!",
            description: `Welcome to ${role} dashboard`,
          });
          
          // Small delay to ensure sessionStorage is set before navigation
          setTimeout(() => {
            router.push('/dashboard');
            // Force a refresh to ensure session is loaded
            router.refresh();
          }, 100);
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: result.error || "Invalid credentials. Please try again.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during login. Please try again.",
        });
      } finally {
        setLoading(false);
      }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setIsSignup(false);
    setCustomerName('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'from-green-500 to-green-600';
      case 'shopkeeper': return 'from-blue-500 to-blue-600';
      case 'admin': return 'from-purple-500 to-purple-600';
      case 'delivery_agent': return 'from-orange-500 to-orange-600';
      case 'farmer': return 'from-emerald-500 to-teal-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6 flex-wrap gap-3 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 font-bold text-xl sm:text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors duration-300">
          <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            TrustKart
          </span>
        </Link>

        {/* TrustKart Info */}
        <div className="text-right text-xs sm:text-sm">
          <p className="text-slate-600 dark:text-slate-300 mb-1 sm:mb-2">
            TrustKart Platform
          </p>
          <p className="text-primary font-semibold">
            Fresh • Fast • Secure
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 min-h-[calc(100vh-200px)]">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-7xl w-full items-center">
          
          {/* Left Side - Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 order-2 lg:order-1">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white leading-tight mb-4 sm:mb-6">
              Welcome to
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                TrustKart
              </span>
            </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-4 sm:mb-6">
              Your Premium Expiry-Aware Marketplace
            </p>
              <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400">
              Experience seamless shopping with AI-powered recommendations, 
              real-time expiry tracking, and lightning-fast delivery.
            </p>
          </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Fresh Products</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Always fresh & quality assured</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Fast Delivery</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Quick & reliable service</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Secure Platform</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Safe & trusted marketplace</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Store className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Local Shops</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Support your community</p>
                </div>
              </div>
            </div>
                    </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto order-1 lg:order-2">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                  {selectedRole ? (isSignup ? `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account` : `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`) : 'Choose Your Role'}
                    </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  {selectedRole ? (isSignup ? 'Fill in your details to create a new account' : 'Enter your credentials to continue') : 'Select how you want to access TrustKart'}
                    </CardDescription>
                  </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                {!selectedRole ? (
                  /* Role Selection */
                  <div className="space-y-3 sm:space-y-4">
                    {/* Customer */}
                    <Button
                      variant="outline"
                      className="w-full h-auto min-h-[64px] sm:h-16 flex items-center gap-3 sm:gap-4 justify-start p-3 sm:p-4 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300"
                      onClick={() => setSelectedRole('customer')}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Customer</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">Browse & shop products</div>
                      </div>
                    </Button>

                    {/* Shopkeeper */}
                    <Button
                      variant="outline"
                      className="w-full h-auto min-h-[64px] sm:h-16 flex items-center gap-3 sm:gap-4 justify-start p-3 sm:p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300"
                      onClick={() => setSelectedRole('shopkeeper')}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Store className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Shopkeeper</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">Manage your shop</div>
                      </div>
                    </Button>

                    {/* Admin */}
                    <Button 
                      variant="outline"
                      className="w-full h-auto min-h-[64px] sm:h-16 flex items-center gap-3 sm:gap-4 justify-start p-3 sm:p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300"
                      onClick={() => setSelectedRole('admin')}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Admin</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">Platform management</div>
                      </div>
                    </Button>

                    {/* Delivery Agent */}
                    <Button 
                      variant="outline"
                      className="w-full h-auto min-h-[64px] sm:h-16 flex items-center gap-3 sm:gap-4 justify-start p-3 sm:p-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300"
                      onClick={() => setSelectedRole('delivery_agent')}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Delivery Agent</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">Deliver orders</div>
                      </div>
                    </Button>

                    {/* Farmer */}
                    <Button 
                      variant="outline"
                      className="w-full h-auto min-h-[64px] sm:h-16 flex items-center gap-3 sm:gap-4 justify-start p-3 sm:p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300"
                      onClick={() => setSelectedRole('farmer')}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Farmer</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">Sell organic vegetables</div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  /* Credential Form */
                  <div className="space-y-3 sm:space-y-4">
                    {/* Customer Signup Fields - SIMPLIFIED */}
                    {selectedRole === 'customer' && isSignup && (
                      <>
                        {console.log('Rendering SIMPLIFIED customer signup fields')}
                        {/* Name Field - ONLY FIELD NEEDED */}
                        <div>
                          <Label htmlFor="customerName" className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Full Name</Label>
                          <div className="relative mt-1">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="customerName"
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter your full name"
                              className="pl-10 h-11 sm:h-12 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Email Field */}
                    <div>
                      <Label htmlFor="email" className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10 h-11 sm:h-12 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <Label htmlFor="password" className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base"
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
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          if (selectedRole === 'customer') {
                            handleCustomerLogin();
                          } else {
                            handleCredentialLogin(selectedRole as 'shopkeeper' | 'admin' | 'delivery_agent' | 'farmer');
                          }
                        }}
                        disabled={loading}
                        className={`w-full h-11 sm:h-12 bg-gradient-to-r ${getRoleColor(selectedRole)} hover:opacity-90 text-white font-semibold text-sm sm:text-base`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            <span className="text-xs sm:text-sm">{isSignup ? 'Creating Account...' : 'Logging in...'}</span>
                        </>
                      ) : (
                        <>
                            <span>{isSignup ? 'Create Account' : 'Login'}</span>
                          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </Button>

                      {/* Customer Registration Link */}
                      {selectedRole === 'customer' && (
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
                      )}

                      {/* Shopkeeper Registration Link */}
                      {selectedRole === 'shopkeeper' && (
                        <div className="text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            Don't have a shop account?
                          </p>
                          <Link 
                            href="/shopkeeper-registration" 
                            className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            <Building2 className="h-4 w-4" />
                            Register Your Shop
                          </Link>
                        </div>
                      )}

                      {/* Delivery Agent Registration Link */}
                      {selectedRole === 'delivery_agent' && (
                        <div className="text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            Want to become a delivery agent?
                          </p>
                          <Link 
                            href="/delivery-agent-registration" 
                            className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            <Truck className="h-4 w-4" />
                            Register as Delivery Agent
                          </Link>
                        </div>
                      )}

                      {/* Farmer Registration Link */}
                      {selectedRole === 'farmer' && (
                        <div className="text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            Want to sell your organic vegetables?
                          </p>
                          <Link 
                            href="/farmer-registration" 
                            className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            <Leaf className="h-4 w-4" />
                            Register as Farmer
                          </Link>
                        </div>
                      )}

                      {/* Back Button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRole(null);
                          resetForm();
                        }}
                        className="w-full"
                      >
                        ← Back to Role Selection
                      </Button>
                    </div>
                  </div>
                )}
                  </CardContent>
                </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center p-4 sm:p-6">
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          © 2025 TrustKart. All rights reserved.
        </p>
      </div>
    </div>
  );
}