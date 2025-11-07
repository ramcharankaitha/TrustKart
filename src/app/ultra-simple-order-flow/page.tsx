'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Package, User, Phone, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-db';
import { useRouter } from 'next/navigation';

export default function UltraSimpleOrderFlowPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading orders for shopkeeper...');
      
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      console.log('User session:', userSession);
      
      if (!userSession.id) {
        console.error('❌ No user session found');
        setError('No user session found. Please log in.');
        router.push('/login');
        return;
      }

      if (userSession.role?.toLowerCase() !== 'shopkeeper') {
        console.error('❌ User is not a shopkeeper. Role:', userSession.role);
        setError('You must be logged in as a shopkeeper to view orders.');
        return;
      }

      // Get shops owned by this user
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', userSession.id);
      
      if (shopsError || !shops || shops.length === 0) {
        setError('No shops found. Please register a shop first.');
        return;
      }

      const shopId = shops[0].id;
      console.log('🔍 Using shop ID:', shopId);

      // Get orders for this shop
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('❌ Error loading orders:', ordersError);
        setError(`Failed to load orders: ${ordersError.message}`);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Get order items and customer details for each order
      const ordersWithDetails = await Promise.all(
        ordersData.map(async (order) => {
          // Try to get order items - handle if table doesn't exist or has different structure
          let orderItems = [];
          try {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            
            if (!itemsError && itemsData) {
              // Try to get product details for each item
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

          // Get customer details
          let customer = { name: 'Unknown Customer', email: '', phone: '' };
          try {
            const { data: customerData, error: customerError } = await supabase
              .from('users')
              .select('name, email, phone')
              .eq('id', order.customer_id)
              .single();
            
            if (!customerError && customerData) {
              customer = customerData;
            }
          } catch (error) {
            console.error('Error fetching customer:', error);
          }
          
          return {
            ...order,
            order_items: orderItems,
            customer: customer
          };
        })
      );

      console.log('✅ Orders loaded successfully:', ordersWithDetails);
      setOrders(ordersWithDetails);
      
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderApproval = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      
      console.log('🔍 Approving order:', orderId);
      
      // Update order status to APPROVED
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'APPROVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (orderError) {
        console.error('❌ Error approving order:', orderError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to approve order: ${orderError.message}`,
        });
        return;
      }

      // Try to update order items if table exists
      try {
        await supabase
          .from('order_items')
          .update({ 
            approval_status: 'APPROVED',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);
      } catch (error) {
        console.log('Order items table might not exist, skipping update:', error);
      }

      // Get order details for notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Create notification for customer
        await createNotification({
          user_id: order.customer_id,
          order_id: orderId,
          type: 'order_approved',
          title: 'Order Approved! 🎉',
          message: `Your order #${order.order_number || orderId.slice(-8)} has been approved. Please proceed to payment.`,
          action_url: `/payment/${orderId}`,
          action_text: 'Pay Now'
        });
      }

      console.log('✅ Order approved successfully');
      
      toast({
        title: "Order Approved! 🎉",
        description: "Order has been approved and customer has been notified to proceed with payment.",
      });

      // Reload orders
      await loadOrders();
      
    } catch (error) {
      console.error('❌ Error approving order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve order.",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleOrderRejection = async (orderId: string, reason: string) => {
    try {
      setProcessingOrder(orderId);
      
      console.log('🔍 Rejecting order:', orderId, 'Reason:', reason);
      
      // Update order status to REJECTED
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (orderError) {
        console.error('❌ Error rejecting order:', orderError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to reject order: ${orderError.message}`,
        });
        return;
      }

      // Try to update order items if table exists
      try {
        await supabase
          .from('order_items')
          .update({ 
            approval_status: 'REJECTED',
            rejection_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);
      } catch (error) {
        console.log('Order items table might not exist, skipping update:', error);
      }

      // Get order details for notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Create notification for customer
        await createNotification({
          user_id: order.customer_id,
          order_id: orderId,
          type: 'order_rejected',
          title: 'Order Rejected',
          message: `Your order #${order.order_number || orderId.slice(-8)} has been rejected. Reason: ${reason}`,
          action_url: `/my-orders`,
          action_text: 'View Orders'
        });
      }

      console.log('✅ Order rejected successfully');
      
      toast({
        title: "Order Rejected",
        description: "Order has been rejected and customer has been notified with the reason.",
      });

      // Close dialog and reload orders
      setRejectDialogOpen(false);
      setRejectionReason('');
      await loadOrders();
      
    } catch (error) {
      console.error('❌ Error rejecting order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject order.",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const createNotification = async (notificationData: {
    user_id: string;
    order_id: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    action_text?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          order_id: notificationData.order_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          action_url: notificationData.action_url,
          action_text: notificationData.action_text
        });

      if (error) {
        console.error('❌ Error creating notification:', error);
      } else {
        console.log('✅ Notification created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  };

  const openRejectDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING_APPROVAL':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'PAYMENT_PENDING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case 'PAID':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
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
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Ultra Simple Order Flow</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Manage customer orders with approval/rejection workflow
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
                      <CardTitle className="text-lg">
                        Order #{order.order_number || order.id.slice(-8)}
                      </CardTitle>
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
                          onClick={() => handleOrderApproval(order.id)}
                          disabled={processingOrder === order.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(order.id)}
                          disabled={processingOrder === order.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
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

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p>Subtotal: ₹{order.subtotal.toFixed(2)}</p>
                      <p>Total: ₹{order.total_amount.toFixed(2)}</p>
                    </div>
                    {order.notes && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p><strong>Notes:</strong> {order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Display */}
                {order.status === 'REJECTED' && order.rejection_reason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason:</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{order.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Reason for Rejection
              </label>
              <Textarea
                placeholder="Please provide a reason for rejecting this order..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedOrderId && rejectionReason.trim()) {
                    handleOrderRejection(selectedOrderId, rejectionReason.trim());
                  }
                }}
                disabled={!rejectionReason.trim() || processingOrder === selectedOrderId}
              >
                {processingOrder === selectedOrderId ? 'Rejecting...' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
