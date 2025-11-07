'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Package, User, Phone, MapPin, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-db';
import { useRouter } from 'next/navigation';
import { SessionUtils } from '@/lib/utils/session-utils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  approval_status?: string;
  rejection_reason?: string;
  product: {
    name: string;
    price: number;
    image_url?: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  delivery_address: string;
  delivery_phone: string;
  notes?: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  order_items: OrderItem[];
}

export default function SimpleOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
    
    // Set up real-time polling for order updates (every 5 seconds)
    const interval = setInterval(() => {
      loadOrders();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading orders for shopkeeper...');
      
      // Validate session and role using SessionUtils
      if (!SessionUtils.validateSession(router, 'shopkeeper')) {
        setError('Authentication required. Please log in as a shopkeeper.');
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in as a shopkeeper to view orders.",
        });
        return;
      }

      const userId = SessionUtils.getUserId();
      if (!userId) {
        console.error('❌ No user ID found');
        setError('No user ID found. Please log in again.');
        router.push('/login');
        return;
      }

      console.log('🔍 Getting shops for user:', userId);
      
      // Get shops owned by this user using direct Supabase query
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', userId);
      
      console.log('Shops result:', { shops, shopsError });
      
      if (shopsError) {
        console.error('❌ Error fetching shops:', shopsError);
        setError(`Failed to load shop information: ${shopsError.message}`);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load shop information.",
        });
        return;
      }

      if (!shops || shops.length === 0) {
        console.log('❌ No shops found for user');
        setError('No shops found. Please register a shop first.');
        toast({
          variant: "destructive",
          title: "No Shop Found",
          description: "You need to register a shop first to receive orders.",
        });
        return;
      }

      const shopId = shops[0].id;
      console.log('🔍 Using shop ID:', shopId);

      // Get orders for this shop using direct Supabase query
      console.log('🔍 Fetching orders for shop:', shopId);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      console.log('Orders query result:', { ordersData, ordersError });
      
      if (ordersError) {
        console.error('❌ Error loading orders:', ordersError);
        setError(`Failed to load orders: ${ordersError.message}`);
        toast({
          variant: "destructive",
          title: "Failed to Load Orders",
          description: "Unable to fetch orders. Please try again.",
        });
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log('✅ No orders found for shop');
        setOrders([]);
        return;
      }

      // Get order items for each order
      console.log('🔍 Fetching order items...');
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          // Try to get order items - handle if table doesn't exist or has different structure
          let orderItems = [];
          try {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            
            if (!itemsError && itemsData) {
              // Get product details for each item
              const itemsWithProducts = await Promise.all(
                itemsData.map(async (item) => {
                  try {
                    const { data: product, error: productError } = await supabase
                      .from('products')
                      .select('name, price, image_url')
                      .eq('id', item.product_id)
                      .single();
                    
                    return {
                      ...item,
                      product: product || { name: 'Unknown Product', price: item.price || 0, image_url: null }
                    };
                  } catch (error) {
                    console.error('Error fetching product:', error);
                    return {
                      ...item,
                      product: { name: 'Unknown Product', price: item.price || 0, image_url: null }
                    };
                  }
                })
              );
              orderItems = itemsWithProducts;
            }
          } catch (error) {
            console.log('Order items table might not exist or have different structure:', error);
            // Create mock order items if table doesn't exist
            orderItems = [{
              id: 'mock-item-1',
              product: { name: 'Order Items', price: order.total_amount || 0, image_url: null },
              quantity: 1,
              price: order.total_amount || 0
            }];
          }

          return { ...order, order_items: orderItems };
        })
      );

      // Get customer details for each order
      console.log('🔍 Fetching customer details...');
      const ordersWithCustomers = await Promise.all(
        ordersWithItems.map(async (order) => {
          try {
            const { data: customer, error: customerError } = await supabase
              .from('users')
              .select('name, email, phone')
              .eq('id', order.customer_id)
              .single();
            
            return {
              ...order,
              customer: customer || { name: 'Unknown Customer', email: '', phone: '' }
            };
          } catch (error) {
            console.error('Error fetching customer:', error);
            return {
              ...order,
              customer: { name: 'Unknown Customer', email: '', phone: '' }
            };
          }
        })
      );

      console.log('✅ Orders loaded successfully:', ordersWithCustomers);
      setOrders(ordersWithCustomers);
      
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError(`An error occurred: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingOrder(orderId);
      
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const notes = action === 'reject' ? 'Order rejected by shopkeeper' : 'Order approved by shopkeeper';
      
      console.log('🔍 Updating order status:', { orderId, newStatus, notes });
      
      // Update order status using direct Supabase query
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('❌ Error updating order status:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to ${action} order: ${error.message}`,
        });
        return;
      }

      console.log('✅ Order status updated successfully');
      
      toast({
        title: `Order ${action === 'approve' ? 'Approved' : 'Rejected'}! 🎉`,
        description: `Order has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      // Reload orders to show updated status
      await loadOrders();
      
    } catch (error) {
      console.error('❌ Error handling order action:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} order.`,
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING_APPROVAL':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Approved - Awaiting Payment</Badge>;
      case 'PAID':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />✅ Payment Received</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />✅ Payment Confirmed</Badge>;
      case 'PREPARING':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Package className="h-3 w-3 mr-1" />Preparing</Badge>;
      case 'READY':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><Package className="h-3 w-3 mr-1" />Ready for Delivery</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'DELIVERED':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
              Loading Orders...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Error Loading Orders
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button onClick={loadOrders} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Orders</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Manage customer orders and requests
          </p>
        </div>
        <Button onClick={loadOrders} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            No Orders Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Orders from customers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    {order.status.toUpperCase() === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOrderAction(order.id, 'approve')}
                          disabled={processingOrder === order.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOrderAction(order.id, 'reject')}
                          disabled={processingOrder === order.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {(order.status.toUpperCase() === 'PAID' || order.status.toUpperCase() === 'CONFIRMED') && (
                      <Badge className="bg-green-500 text-white animate-pulse">
                        💰 Payment Confirmed - Ready for Delivery Agent
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p><strong>Name:</strong> {order.customer.name}</p>
                      <p><strong>Email:</strong> {order.customer.email}</p>
                      <p><strong>Phone:</strong> {order.customer.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Information
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p><strong>Address:</strong> {order.delivery_address}</p>
                      <p><strong>Phone:</strong> {order.delivery_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 dark:text-white">Order Items</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{item.product.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Quantity: {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-white">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Confirmation Banner */}
                {(order.status.toUpperCase() === 'PAID' || order.status.toUpperCase() === 'CONFIRMED') && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6" />
                      <div>
                        <h4 className="font-bold text-lg">Payment Confirmed! ✅</h4>
                        <p className="text-sm opacity-90">
                          Customer has completed payment. Order is ready for delivery agent pickup.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p>Subtotal: ₹{order.subtotal.toFixed(2)}</p>
                      <p className="font-bold text-lg">Total: ₹{order.total_amount.toFixed(2)}</p>
                      {(order.status.toUpperCase() === 'PAID' || order.status.toUpperCase() === 'CONFIRMED') && (
                        <p className="text-green-600 font-semibold mt-1">✅ Payment Received</p>
                      )}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p><strong>Notes:</strong> {order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}