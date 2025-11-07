import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, Phone, Mail, Calendar, Settings, User, 
  Home, CheckCircle, Store, TrendingUp, Package, 
  ShoppingCart, Users, Clock, Shield, Star, RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"
import { SupabaseDB } from "@/lib/supabase-db"
import { Chatbot } from "@/components/chatbot"

type ShopkeeperProfile = {
  name: string;
  email: string;
  phone?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  address?: string;
  shopAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  registrationDate?: string;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  shopName?: string;
  shopStatus?: 'approved' | 'pending' | 'rejected';
  totalOrders: number;
  totalRevenue: string;
  activeProducts: number;
  customerRating: number;
};

const buildDefaultProfile = (): ShopkeeperProfile => ({
  name: 'Shopkeeper',
  email: '',
  accountStatus: 'ACTIVE',
  registrationDate: new Date().toISOString().slice(0, 10),
  shopName: undefined,
  shopStatus: undefined,
  totalOrders: 0,
  totalRevenue: '₹0',
  activeProducts: 0,
  customerRating: 0,
});

export default function ShopkeeperDashboard() {
  const [profile, setProfile] = useState<ShopkeeperProfile>(buildDefaultProfile());
  const [userRole, setUserRole] = useState<'customer' | 'shopkeeper' | 'admin' | 'guest'>('shopkeeper');
  
  useEffect(() => {
    const session = sessionStorage.getItem('userSession');
    if (session) {
      try {
        const user = JSON.parse(session);
        setUserRole(user.role || 'shopkeeper');
      } catch (e) {
        setUserRole('shopkeeper');
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const session = sessionStorage.getItem('userSession');
        if (session) {
          const user = JSON.parse(session);
          console.log('🔍 Current session data:', user);
          
          // Always try to fetch fresh user data from database
          let freshUserData = null;
          if (user.id) {
            console.log('🔍 Fetching fresh user data for ID:', user.id);
            console.log('🔍 User ID type:', typeof user.id);
            console.log('🔍 User ID value:', user.id);
            
            try {
              const { data: freshUser, error: fetchError } = await SupabaseDB.getUserById(user.id);
              
              console.log('🔍 Database response:', { freshUser, fetchError });
              
              if (fetchError) {
                console.error('❌ Database error details:', {
                  message: fetchError.message,
                  details: fetchError.details,
                  hint: fetchError.hint,
                  code: fetchError.code
                });
                
                // If user not found, try to get user by email instead
                if (fetchError.code === 'PGRST116' || fetchError.message.includes('No rows found')) {
                  console.log('🔍 User not found by ID, trying by email...');
                  const { data: userByEmail, error: emailError } = await SupabaseDB.getUserByEmail(user.email);
                  
                  if (!emailError && userByEmail) {
                    console.log('✅ Found user by email:', userByEmail);
                    freshUserData = userByEmail;
                    
                    // Update session with fresh data
                    const updatedSession = {
                      ...user,
                      id: userByEmail.id, // Update ID in session
                      phone: userByEmail.phone,
                      date_of_birth: userByEmail.date_of_birth,
                      aadhaar_number: userByEmail.aadhaar_number
                    };
                    sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
                    console.log('✅ Updated session with fresh data:', updatedSession);
                  } else {
                    console.error('❌ Error fetching user by email:', emailError);
                  }
                }
              } else if (freshUser) {
                console.log('✅ Fresh user data from database:', freshUser);
                console.log('🔍 Gender from database:', freshUser.gender);
                freshUserData = freshUser;
                
                // Update session with fresh data
                const updatedSession = {
                  ...user,
                  phone: freshUser.phone,
                  date_of_birth: freshUser.date_of_birth,
                  aadhaar_number: freshUser.aadhaar_number
                };
                sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
                console.log('✅ Updated session with fresh data:', updatedSession);
              }
            } catch (fetchError) {
              console.error('❌ Exception fetching fresh user data:', fetchError);
              console.error('❌ Exception details:', fetchError);
            }
          } else {
            console.warn('⚠️ No user ID found in session');
          }

          const nextProfile: ShopkeeperProfile = {
            ...buildDefaultProfile(),
            name: user.name || 'Shopkeeper',
            email: user.email || '',
            phone: freshUserData?.phone || user.phone || '',
            mobileNumber: freshUserData?.phone || user.phone || '',
            dateOfBirth: freshUserData?.date_of_birth || user.date_of_birth || '',
            aadhaarNumber: freshUserData?.aadhaar_number || user.aadhaar_number || '',
          };

          console.log('🔍 Final profile data:', nextProfile);

          // Fetch the latest shop for this owner
          if (user.id) {
            const { data, error } = await SupabaseDB.getShopsByOwner(user.id as string);
            if (!error && Array.isArray(data) && data.length > 0) {
              const shop = data[0];
              nextProfile.shopName = shop.name;
              nextProfile.shopStatus = (shop.status || 'pending').toString().toLowerCase();
              
              // Build shop address from shop registration data
              const shopAddressParts = [
                shop.address,
                shop.city,
                shop.state,
                shop.pincode
              ].filter(Boolean);
              nextProfile.shopAddress = shopAddressParts.join(', ');
              
              console.log('🔍 Shop data:', shop);
              console.log('🔍 Shop address built:', nextProfile.shopAddress);
            }
          }

          setProfile(nextProfile);
        }
      } catch (error) {
        console.error('❌ Error in load function:', error);
        // keep defaults
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Professional Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
            <Store className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
              Welcome, {profile.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {profile.shopName || 'Your Shop'} • Shopkeeper Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            {profile.accountStatus}
          </Badge>
          {profile.shopStatus && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              {profile.shopStatus.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{profile.totalOrders}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+12% this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">{profile.totalRevenue}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+8% this month</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active Products</p>
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{profile.activeProducts}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">5 new this week</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Customer Rating</p>
                <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">{profile.customerRating}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Based on 89 reviews</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
            <CardDescription>Your account and personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.registrationDate ? `Shopkeeper since ${new Date(profile.registrationDate).toLocaleDateString()}` : ''}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              
              {/* Contact Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.mobileNumber || profile.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.shopAddress || '—'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Aadhaar Number: {profile.aadhaarNumber || '—'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Information
            </CardTitle>
            <CardDescription>Your shop details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Shop Status */}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.shopName || 'Not Registered'}</h3>
                  <Badge className="bg-green-100 text-green-700 border-green-200 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {(profile.shopStatus || 'PENDING').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Shop Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Registration Date</span>
                  </div>
                  <span className="text-sm font-medium">{profile.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Customers</span>
                  </div>
                  <span className="text-sm font-medium">89</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Product Categories</span>
                  </div>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Average Rating</span>
                  </div>
                  <span className="text-sm font-medium">{profile.customerRating}/5.0</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Products Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Products
            </CardTitle>
            <CardDescription>Manage your product inventory and add new items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Add Product */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Quick Add Product</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Add new products to your inventory with detailed information
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={() => window.location.href = '/dashboard/products?add=1'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
              
              {/* Product Management Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Products</span>
                  </div>
                  <span className="text-sm font-medium">{profile.activeProducts}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Orders</span>
                  </div>
                  <span className="text-sm font-medium">{profile.totalOrders}</span>
              </div>
              </div>

              {/* Product Management Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/products'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  View All Products
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/products?add=1'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/analytics'}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Product Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
            
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" onClick={() => window.location.href = '/dashboard/profile'}>
                <Settings className="h-4 w-4 mr-2" />
          Update Profile
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          <Store className="h-4 w-4 mr-2" />
          Manage Shop
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/products?add=1'}>
          <Package className="h-4 w-4 mr-2" />
          Add Products
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/analytics'}>
          <TrendingUp className="h-4 w-4 mr-2" />
          View Analytics
              </Button>
            </div>
      <Chatbot userRole={userRole} />
    </div>
  )
}
