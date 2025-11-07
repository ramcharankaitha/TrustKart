"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Leaf, Home, Package, ShoppingCart, Users, LineChart, Bot, Settings, 
  ShieldCheck, Truck, CheckCircle, Flag, Bell, Activity, TrendingUp,
  Store, User, Crown, Sparkles, CreditCard, FileText, UserCheck, UserX,
  StoreIcon, Clock, DollarSign, BarChart3, Plus, Edit, Trash2,
  RefreshCw, LogOut, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FC } from 'react';
import type { User } from "@/lib/types";

const allNavItems = {
  shopkeeper: [
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600" },
    { href: "/dashboard/products", icon: Package, label: "Add Products", color: "text-green-600" },
    { href: "/dashboard/add-organic-vegetable", icon: Leaf, label: "Add Organic Vegetable", color: "text-green-700" },
    { href: "/dashboard/simple-orders", icon: ShoppingCart, label: "Orders", badge: 6, color: "text-purple-600" },
    { href: "/dashboard/discounts", icon: Bot, label: "AI Discounts", color: "text-orange-600" },
    { href: "/dashboard/customers", icon: Users, label: "Customers", color: "text-indigo-600" },
    { href: "/dashboard/analytics", icon: LineChart, label: "Analytics", color: "text-pink-600" },
  ],
  customer: [
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600" },
    { href: "/dashboard/my-orders", icon: ShoppingCart, label: "My Orders", color: "text-purple-600" },
    { href: "/dashboard/my-complaints", icon: Flag, label: "My Complaints", color: "text-red-600" },
  ],
  guest: [],
  admin: [
    // Dashboard - Overview
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600", description: "Overview of total users, shops, orders, and revenue" },
    
    // Users Management
    { href: "/dashboard/users", icon: Users, label: "Users", color: "text-indigo-600", description: "View all users, Block/Unblock users" },
    
    // Shop Requests Management
    { href: "/dashboard/admin-approvals", icon: StoreIcon, label: "Shop Requests", color: "text-green-600", badge: "3", description: "Pending Requests, Approved Shops, Rejected Requests" },
    
    // Orders Management
    { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders", color: "text-orange-600", badge: "6", description: "All Orders, Pending/Completed/Cancelled" },
    
    // Payments Management
    { href: "/dashboard/payments", icon: CreditCard, label: "Payments", color: "text-emerald-600", description: "All Transactions, Refund Requests" },
    
    // Settings
    { href: "/dashboard/settings", icon: Settings, label: "Settings", color: "text-slate-600", description: "App Settings, Admin Profile, Logout" },
  ],
  delivery: [
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600" },
  ],
  delivery_agent: [
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600" },
  ],
  farmer: [
    { href: "/dashboard", icon: Home, label: "Dashboard", color: "text-blue-600" },
    { href: "/dashboard/add-organic-vegetable", icon: Leaf, label: "Add Vegetable", color: "text-green-600" },
  ],
  super_admin: [
    { href: "/dashboard", icon: Home, label: "Super Dashboard", color: "text-blue-600" },
    { href: "/dashboard/all-shops", icon: Package, label: "All Shops", color: "text-green-600" },
    { href: "/dashboard/all-users", icon: Users, label: "All Users", color: "text-indigo-600" },
    { href: "/dashboard/system-health", icon: ShieldCheck, label: "System Health", color: "text-red-600" },
  ],
};

const getNavItems = (role: User['role'] | 'guest') => {
  if (role === 'customer' || role === 'guest') return allNavItems.customer;
  if (role === 'shopkeeper') return allNavItems.shopkeeper;
  if (role === 'admin') return allNavItems.admin;
  if (role === 'delivery' || role === 'delivery_agent') return allNavItems.delivery_agent || allNavItems.delivery;
  if (role === 'farmer') return allNavItems.farmer;
  if (role === 'super_admin') return allNavItems.super_admin;
  return allNavItems.customer; // Changed default from shopkeeper to customer
};

const getRoleIcon = (role: User['role'] | 'guest') => {
  switch (role) {
    case 'customer': return User;
    case 'shopkeeper': return Store;
    case 'admin': return ShieldCheck;
    case 'delivery':
    case 'delivery_agent': return Truck;
    case 'farmer': return Leaf;
    case 'super_admin': return Crown;
    default: return User;
  }
};

const getRoleColor = (role: User['role'] | 'guest') => {
  switch (role) {
    case 'customer': return 'bg-blue-500';
    case 'shopkeeper': return 'bg-green-500';
    case 'admin': return 'bg-purple-500';
    case 'delivery':
    case 'delivery_agent': return 'bg-orange-500';
    case 'super_admin': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getRoleGradient = (role: User['role'] | 'guest') => {
  switch (role) {
    case 'customer': return 'from-blue-400 to-blue-600';
    case 'shopkeeper': return 'from-green-400 to-green-600';
    case 'admin': return 'from-purple-400 to-purple-600';
    case 'delivery':
    case 'delivery_agent': return 'from-orange-400 to-orange-600';
    case 'farmer': return 'from-emerald-400 to-teal-600';
    case 'super_admin': return 'from-red-400 to-red-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const DashboardSidebar: FC<{ 
  userRole: User['role'] | 'guest';
  onNavigate?: () => void;
}> = ({ userRole, onNavigate }) => {
  const pathname = usePathname();
  const navItems = getNavItems(userRole);
  const RoleIcon = getRoleIcon(userRole);
  const roleGradient = getRoleGradient(userRole);

  return (
    <div className="w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href={userRole === 'shopkeeper' ? "/dashboard" : "/dashboard"} className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-headline">
              TrustKart
            </span>
          </Link>
        </div>

        {/* User Role Card */}
        <div className={`mb-8 p-4 rounded-2xl bg-gradient-to-br ${roleGradient} text-white shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <RoleIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm capitalize">{userRole} Dashboard</div>
              <div className="text-xs opacity-90">Welcome back!</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive ? "text-white" : item.color
                  )} />
                  <span className="flex-1">{item.label}</span>
                  
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        isActive 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                  )}
                </Link>
                
                {/* Description for admin items */}
                {userRole === 'admin' && item.description && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 text-sm">Quick Stats</h3>
          <div className="space-y-3">
            {userRole === 'admin' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Pending Shops</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Approved Shops</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Rejected Shops</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Total Users</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">2.4K</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Total Revenue</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">₹1.2M</span>
                </div>
              </>
            ) : userRole === 'delivery' || userRole === 'delivery_agent' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Active Deliveries</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Today's Earnings</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">₹0.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Total Deliveries</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">0</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Active Orders</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Total Revenue</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">₹24.5K</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">New Customers</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">8</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-white">Settings</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Manage your account</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};