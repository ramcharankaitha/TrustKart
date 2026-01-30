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

  // Show admin dashboard for admin users - Use the full AdminDashboard component
  if ((userRole as string) === 'admin' || (userRole as string) === 'super_admin') {
    return <AdminDashboard />;
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