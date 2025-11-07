'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import ShopkeeperDashboard from '@/components/shopkeeper-dashboard';
import CustomerDashboard from '@/components/customer-dashboard';
import AdminDashboard from '@/components/admin-dashboard';
import DeliveryAgentDashboard from '@/components/delivery-agent-dashboard';
import FarmerDashboard from '@/components/farmer-dashboard';
import { Leaf } from 'lucide-react';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<User['role'] | 'guest' | 'super_admin' | 'delivery_agent'>('guest');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const handleStorageChange = () => {
      // Check localStorage first (for backward compatibility)
      const localRole = localStorage.getItem('userRole') as User['role'] | null;
      
      // Check sessionStorage for Supabase authentication
      const sessionData = sessionStorage.getItem('userSession');
      const deliveryAgentSession = sessionStorage.getItem('deliveryAgentSession');
      const farmerSession = sessionStorage.getItem('farmerSession');
      let sessionRole: User['role'] | null = null;
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          sessionRole = session.role as User['role'];
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      } else if (deliveryAgentSession) {
        try {
          const session = JSON.parse(deliveryAgentSession);
          sessionRole = 'delivery_agent' as User['role'];
        } catch (error) {
          console.error('Error parsing delivery agent session data:', error);
        }
      } else if (farmerSession) {
        try {
          const session = JSON.parse(farmerSession);
          sessionRole = 'farmer' as User['role'];
        } catch (error) {
          console.error('Error parsing farmer session data:', error);
        }
      }
      
      // Use session role if available, otherwise fall back to localStorage
      const rawRole = (sessionRole || localRole || 'guest') as string;
      const normalizedRole = (rawRole || 'guest').toString().toLowerCase() as User['role'] | 'guest';
      setUserRole(normalizedRole);
      
      // Shopkeepers will see their profile dashboard instead of redirecting
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  // Show admin dashboard for admin users
  if ((userRole as string) === 'admin' || (userRole as string) === 'super_admin') {
    return (
      <div className="space-y-8">
        {/* Overview Statistics Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">2,456</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    2,103 active, 12 blocked
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Shops */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Shops</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-200">15</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    10 approved, 3 pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">1,847</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    1,789 completed, 23 pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">₹12.5L</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹156K this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Shop Requests</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">FreshMart Store</p>
                  <p className="text-sm text-muted-foreground">Pending approval</p>
                </div>
                <span className="text-yellow-600 font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium">DairyDelight</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <span className="text-green-600 font-semibold">10</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <span className="text-green-600 font-semibold">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Gateway</span>
                <span className="text-green-600 font-semibold">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">View All Users</span>
                <p className="text-sm text-muted-foreground">Manage user accounts</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">Review Shop Requests</span>
                <p className="text-sm text-muted-foreground">Approve or reject shops</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">System Settings</span>
                <p className="text-sm text-muted-foreground">Configure platform</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Shopkeepers are redirected to products page, so this section is no longer needed

  // Show shopkeeper dashboard for shopkeeper users
  if (userRole === 'shopkeeper') {
    return <ShopkeeperDashboard />;
  }

  // Show customer dashboard for customer users
  if (userRole === 'customer') {
    return <CustomerDashboard />;
  }

  // Show delivery agent dashboard for delivery agent users
  if (userRole === 'delivery_agent' || (userRole as string).toLowerCase() === 'delivery_agent') {
    console.log('Rendering DeliveryAgentDashboard for role:', userRole);
    return <DeliveryAgentDashboard />;
  }

  // Show farmer dashboard for farmer users
  if (userRole === 'farmer' || (userRole as string).toLowerCase() === 'farmer') {
    return <FarmerDashboard />;
  }

  // Show admin dashboard for admin users
  if ((userRole as string) === 'admin' || (userRole as string) === 'super_admin') {
    return (
      <div className="space-y-8">
        {/* Overview Statistics Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">2,456</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    2,103 active, 12 blocked
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Shops */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Shops</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-200">15</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    10 approved, 3 pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">1,847</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    1,789 completed, 23 pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">₹12.5L</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹156K this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Shop Requests</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">FreshMart Store</p>
                  <p className="text-sm text-muted-foreground">Pending approval</p>
                </div>
                <span className="text-yellow-600 font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium">DairyDelight</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <span className="text-green-600 font-semibold">10</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <span className="text-green-600 font-semibold">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Gateway</span>
                <span className="text-green-600 font-semibold">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">View All Users</span>
                <p className="text-sm text-muted-foreground">Manage user accounts</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">Review Shop Requests</span>
                <p className="text-sm text-muted-foreground">Approve or reject shops</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="font-medium">System Settings</span>
                <p className="text-sm text-muted-foreground">Configure platform</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default to customer view for guests only
  if (userRole === 'guest') {
    return <CustomerDashboard />;
  }

  // For any other role (shouldn't happen), show a loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <Leaf className="h-8 w-8 text-white" />
        </div>
        <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">Redirecting...</div>
      </div>
    </div>
  );
}