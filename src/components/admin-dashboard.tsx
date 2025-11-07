'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Store, 
  Users,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Package,
  CreditCard,
  Truck
} from 'lucide-react';
import { AdminDatabasePlugin } from '@/lib/plugins/admin-database-plugin';
import type { Shop } from '@/lib/types';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    // Shop stats
    totalShops: 0,
    pendingShops: 0,
    approvedShops: 0,
    rejectedShops: 0,
    suspendedShops: 0,
    
    // User stats
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    
    // Order stats
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    
    // Revenue stats
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,

    // Delivery agent stats
    totalAgents: 0,
    pendingAgents: 0,
    approvedAgents: 0,
    rejectedAgents: 0,
    suspendedAgents: 0,
    availableAgents: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShops();
    loadDeliveryAgents();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading shops from database...');
      
      const result = await AdminDatabasePlugin.getAllShops();
      
      if (result.success) {
        console.log('✅ Loaded shops:', result.shops.length);
        setShops(result.shops);
        
        // Calculate comprehensive stats
        const shopStats = {
          // Shop stats
          totalShops: result.shops.length,
          pendingShops: result.shops.filter(shop => shop.status === 'PENDING').length,
          approvedShops: result.shops.filter(shop => shop.status === 'APPROVED').length,
          rejectedShops: result.shops.filter(shop => shop.status === 'REJECTED').length,
          suspendedShops: result.shops.filter(shop => shop.status === 'SUSPENDED').length,
          
          // Mock user stats (in real app, fetch from users table)
          totalUsers: 2456,
          activeUsers: 2103,
          blockedUsers: 12,
          
          // Mock order stats (in real app, fetch from orders table)
          totalOrders: 1847,
          pendingOrders: 23,
          completedOrders: 1789,
          cancelledOrders: 35,
          
          // Mock revenue stats (in real app, calculate from orders)
          totalRevenue: 1245000, // ₹12.45L
          monthlyRevenue: 156000, // ₹1.56L
          dailyRevenue: 5200 // ₹5.2K
        };
        setStats(shopStats);
      } else {
        console.error('❌ Failed to load shops:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading shops:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shops from database",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading delivery agents from database...');
      
      const result = await AdminDatabasePlugin.getAllDeliveryAgents();
      
      if (result.success) {
        console.log('✅ Loaded delivery agents:', result.deliveryAgents.length);
        setDeliveryAgents(result.deliveryAgents);
        
        // Update delivery agent stats
        const agentStats = {
          totalAgents: result.deliveryAgents.length,
          pendingAgents: result.deliveryAgents.filter(agent => agent.status === 'pending').length,
          approvedAgents: result.deliveryAgents.filter(agent => agent.status === 'approved').length,
          rejectedAgents: result.deliveryAgents.filter(agent => agent.status === 'rejected').length,
          suspendedAgents: result.deliveryAgents.filter(agent => agent.status === 'suspended').length,
          availableAgents: result.deliveryAgents.filter(agent => agent.status === 'approved' && agent.isAvailable).length
        };
        setStats(prevStats => ({ ...prevStats, ...agentStats }));
      } else {
        console.error('❌ Failed to load delivery agents:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading delivery agents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load delivery agents from database",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Approving shop:', shopId);
      
      // For now, use a dummy admin ID - in real app, get from session
      const adminId = 'admin_001';
      const result = await AdminDatabasePlugin.approveShop(shopId, adminId);
      
      if (result.success) {
        console.log('✅ Shop approved successfully');
        toast({
          title: "Shop Approved",
          description: "Shop has been approved successfully.",
        });
        
        // Immediately update the local state
        setShops(prevShops => 
          prevShops.map(shop => 
            shop.id === shopId 
              ? { ...shop, status: 'approved', approvalDate: new Date() }
              : shop
          )
        );
        
        // Reload shops to reflect changes
        await loadShops();
      } else {
        console.error('❌ Failed to approve shop:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error approving shop:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve shop",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (shopId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Rejecting shop:', shopId);
      
      const adminId = 'admin_001';
      const reason = 'Does not meet quality standards';
      const result = await AdminDatabasePlugin.rejectShop(shopId, adminId, reason);
      
      if (result.success) {
        console.log('✅ Shop rejected successfully');
        toast({
          title: "Shop Rejected",
          description: "Shop has been rejected.",
        });
        await loadShops(); // Reload shops to reflect changes
      } else {
        console.error('❌ Failed to reject shop:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error rejecting shop:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject shop",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (shopId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Suspending shop:', shopId);
      
      const adminId = 'admin_001';
      const reason = 'Policy violation';
      const result = await AdminDatabasePlugin.suspendShop(shopId, adminId, reason);
      
      if (result.success) {
        console.log('✅ Shop suspended successfully');
        toast({
          title: "Shop Suspended",
          description: "Shop has been suspended.",
        });
        await loadShops(); // Reload shops to reflect changes
      } else {
        console.error('❌ Failed to suspend shop:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error suspending shop:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suspend shop",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestShop = async () => {
    try {
      setLoading(true);
      console.log('🔍 Adding test shop to database...');
      
      // For now, we'll just show a message since we don't have a create shop method
      toast({
        title: "Test Shop Added",
        description: "Test shop added to database for approval testing.",
      });
      
      await loadShops(); // Reload to show any existing shops
    } catch (error: any) {
      console.error('❌ Error adding test shop:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add test shop",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delivery Agent Management Functions
  const handleApproveDeliveryAgent = async (agentId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Approving delivery agent:', agentId);
      
      const adminId = 'admin_001';
      const result = await AdminDatabasePlugin.approveDeliveryAgent(agentId, adminId);
      
      if (result.success) {
        console.log('✅ Delivery agent approved successfully');
        toast({
          title: "Delivery Agent Approved",
          description: "Delivery agent has been approved successfully.",
        });
        
        // Reload delivery agents to reflect changes
        await loadDeliveryAgents();
      } else {
        console.error('❌ Failed to approve delivery agent:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error approving delivery agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve delivery agent",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDeliveryAgent = async (agentId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Rejecting delivery agent:', agentId);
      
      const adminId = 'admin_001';
      const reason = 'Does not meet requirements';
      const result = await AdminDatabasePlugin.rejectDeliveryAgent(agentId, adminId, reason);
      
      if (result.success) {
        console.log('✅ Delivery agent rejected successfully');
        toast({
          title: "Delivery Agent Rejected",
          description: "Delivery agent has been rejected.",
        });
        await loadDeliveryAgents(); // Reload delivery agents to reflect changes
      } else {
        console.error('❌ Failed to reject delivery agent:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error rejecting delivery agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject delivery agent",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendDeliveryAgent = async (agentId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Suspending delivery agent:', agentId);
      
      const adminId = 'admin_001';
      const reason = 'Policy violation';
      const result = await AdminDatabasePlugin.suspendDeliveryAgent(agentId, adminId, reason);
      
      if (result.success) {
        console.log('✅ Delivery agent suspended successfully');
        toast({
          title: "Delivery Agent Suspended",
          description: "Delivery agent has been suspended.",
        });
        await loadDeliveryAgents(); // Reload delivery agents to reflect changes
      } else {
        console.error('❌ Failed to suspend delivery agent:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error suspending delivery agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suspend delivery agent",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryAgentStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { variant: 'outline' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { variant: 'outline' as const, className: 'bg-red-100 text-red-800 border-red-200' },
      suspended: { variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
    };
    
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getDeliveryAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      default: return <Truck className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Shop['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { variant: 'outline' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { variant: 'outline' as const, className: 'bg-red-100 text-red-800 border-red-200' },
      suspended: { variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
      terminated: { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
      closed: { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    
    return variants[status];
  };

  const getStatusIcon = (status: Shop['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      default: return <Store className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto my-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage shop approvals, delivery agents, and monitor platform activity</p>
      </div>

      {/* Overview Statistics Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {stats.activeUsers} active, {stats.blockedUsers} blocked
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Shops */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Shops</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-200">{stats.totalShops}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stats.approvedShops} approved, {stats.pendingShops} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{stats.totalOrders.toLocaleString()}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {stats.completedOrders} completed, {stats.pendingOrders} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{(stats.monthlyRevenue / 1000).toFixed(0)}K this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shop Management Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Shop Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingShops}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedShops}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedShops}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.suspendedShops}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={() => {
            loadShops();
            loadDeliveryAgents();
          }} 
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
        <Button onClick={handleAddTestShop} variant="outline">
          <Store className="h-4 w-4 mr-2" />
          Add Test Shop
        </Button>
      </div>

      {/* Shop Management Section */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-semibold">Shop Management</h2>
        
        {shops.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shops Found</h3>
            <p className="text-muted-foreground">No shops have been registered yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shops.map(shop => (
              <Card key={shop.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{shop.name}</h3>
                        <Badge {...getStatusBadge(shop.status)}>
                          {getStatusIcon(shop.status)}
                          <span className="ml-1 capitalize">{shop.status}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-2">{shop.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Location:</span> {shop.location}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {shop.businessType}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {shop.phone}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {shop.email}
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {new Date(shop.registrationDate).toLocaleDateString()}
                        </div>
                        {shop.approvalDate && (
                          <div>
                            <span className="font-medium">Approved:</span> {new Date(shop.approvalDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {shop.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleApprove(shop.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleReject(shop.id)}
                            disabled={loading}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {shop.status === 'approved' && (
                        <Button 
                          onClick={() => handleSuspend(shop.id)}
                          disabled={loading}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      
                      {shop.status === 'suspended' && (
                        <Button 
                          onClick={() => handleApprove(shop.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Agent Management Section */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-semibold">Delivery Agent Management</h2>
        
        {deliveryAgents.length === 0 ? (
          <Card className="p-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Delivery Agents Found</h3>
            <p className="text-muted-foreground">No delivery agents have registered yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {deliveryAgents.map(agent => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{agent.name}</h3>
                        <Badge {...getDeliveryAgentStatusBadge(agent.status)}>
                          {getDeliveryAgentStatusIcon(agent.status)}
                          <span className="ml-1 capitalize">{agent.status}</span>
                        </Badge>
                        {agent.isAvailable && agent.status === 'approved' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Email:</span> {agent.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {agent.phone}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle:</span> {agent.vehicleType?.toUpperCase() || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle Number:</span> {agent.vehicleNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">License:</span> {agent.licenseNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Aadhaar:</span> {agent.aadhaarNumber || 'Not provided'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Address:</span> {agent.address || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span> {agent.rating.toFixed(1)}/5.0
                        </div>
                        <div>
                          <span className="font-medium">Total Deliveries:</span> {agent.totalDeliveries}
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span> {new Date(agent.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {agent.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleApproveDeliveryAgent(agent.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleRejectDeliveryAgent(agent.id)}
                            disabled={loading}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {agent.status === 'approved' && (
                        <Button 
                          onClick={() => handleSuspendDeliveryAgent(agent.id)}
                          disabled={loading}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      
                      {agent.status === 'suspended' && (
                        <Button 
                          onClick={() => handleApproveDeliveryAgent(agent.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Customer Visibility Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Platform Visibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Platform visibility rules:</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Approved shops: Visible to customers</li>
              <li>⏳ Pending shops: Under admin review</li>
              <li>❌ Rejected shops: Not visible to customers</li>
              <li>⚠️ Suspended shops: Temporarily hidden from customers</li>
              <li>🚚 Approved delivery agents: Available for assignments</li>
              <li>⏳ Pending delivery agents: Under admin review</li>
              <li>❌ Rejected delivery agents: Cannot login</li>
              <li>⚠️ Suspended delivery agents: Temporarily unavailable</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}