'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Package, User, Phone, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDB } from '@/lib/supabase-db';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  delivery_address: string;
  delivery_phone: string;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  order_items: OrderItem[];
}

export default function ShopkeeperOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [itemRejectionReason, setItemRejectionReason] = useState('');
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get user session to find shop ID
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to view orders.",
        });
        setLoading(false);
        setOrders([]);
        return;
      }

      // Check if user is a customer - redirect them to customer orders page
      if (userSession.role && userSession.role.toLowerCase() === 'customer') {
        console.log('✅ User is a customer, redirecting to customer orders page');
        toast({
          variant: "default",
          title: "Redirecting",
          description: "Redirecting you to the customer orders page.",
        });
        router.push('/dashboard/my-orders');
        return;
      }

      console.log('🔍 Looking for shop for user:', userSession.id);
      
      // Get shops owned by current user from database
      const { data: shops, error: shopsError } = await SupabaseDB.getShopsByOwner(userSession.id);
      
      if (shopsError) {
        console.error('❌ Error loading shops:', shopsError);
        toast({
          variant: "destructive",
          title: "Failed to Load Shops",
          description: "Unable to fetch shop information. Please try again.",
        });
        setLoading(false);
        setOrders([]);
        return;
      }

      // Get the first shop owned by current user
      const userShop = shops?.[0];
      
      if (!userShop) {
        console.log('❌ No shop found for user:', userSession.id);
        console.log('🔍 Available shops:', shops);
        toast({
          variant: "destructive",
          title: "Shop Not Found",
          description: "No shop found for this user. Please register a shop first or contact support if you believe this is an error.",
        });
        setLoading(false);
        setOrders([]);
        return;
      }

      console.log('✅ Found shop for user:', userShop);
      console.log('🔍 Loading orders for shop:', userShop.id);
      
      const { data, error } = await SupabaseDB.getOrdersByShop(userShop.id);
      
      if (error) {
        console.error('❌ Error loading orders:', error);
        toast({
          variant: "destructive",
          title: "Failed to Load Orders",
          description: error.message || "Unable to fetch orders. Please try again.",
        });
        setLoading(false);
        setOrders([]);
        return;
      }

      console.log('✅ Orders loaded:', data);
      // Ensure data is always an array
      const ordersArray = Array.isArray(data) ? data : (data ? [data] : []);
      setOrders(ordersArray);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while loading orders.",
      });
      setLoading(false);
      setOrders([]);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingOrder(orderId);
      
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const notes = action === 'reject' ? rejectionReason : undefined;
      
      console.log('🔍 Updating order status:', { orderId, newStatus, notes });
      const { data, error } = await SupabaseDB.updateOrderStatus(orderId, newStatus, notes);
      
      if (error) {
        console.error('❌ Error updating order:', error);
        toast({
          variant: "destructive",
          title: "Failed to Update Order",
          description: "Unable to update order status. Please try again.",
        });
        return;
      }

      console.log('✅ Order updated successfully:', data);
      
      // If order is approved, validate stock and create delivery request
      if (action === 'approve') {
        try {
          // IMPORTANT: Stock validation and deduction happens in the API
          // The API will validate stock before approving and return error if insufficient
          console.log('📍 Creating delivery request and updating stock...');
          const deliveryResponse = await fetch('/api/orders/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
          });

          const deliveryResult = await deliveryResponse.json();
          
          if (!deliveryResult.success) {
            // Stock validation failed or other error
            console.error('❌ Order acceptance failed:', deliveryResult.error);
            toast({
              variant: "destructive",
              title: "Order Approval Failed",
              description: deliveryResult.error || "Failed to approve order. Stock may be insufficient.",
            });
            // Revert order status if it was updated
            await SupabaseDB.updateOrderStatus(orderId, 'PENDING_APPROVAL');
            return;
          }
          
          console.log('✅ Delivery created with location mapping:', deliveryResult);
          toast({
            title: "Order Approved Successfully",
            description: "Stock has been deducted and delivery request created with location mapping for delivery agent.",
          });
        } catch (deliveryError: any) {
          console.error('❌ Error creating delivery:', deliveryError);
          toast({
            variant: "destructive",
            title: "Order Approval Failed",
            description: `Failed to process order approval: ${deliveryError.message || 'Unknown error'}`,
          });
          // Revert order status if it was updated
          await SupabaseDB.updateOrderStatus(orderId, 'PENDING_APPROVAL');
          return;
        }
      }
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notes: notes || order.notes }
            : order
        )
      );

      toast({
        title: `Order Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: action === 'approve' 
          ? "Order request has been approved. Customer will be notified and can proceed to payment."
          : "Order request has been rejected. Customer will be notified with the reason.",
      });

      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error) {
      console.error('❌ Error processing order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while processing the order request.",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleItemAction = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingItem(itemId);
      
      const approvalStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const rejectionReason = action === 'reject' ? itemRejectionReason : undefined;
      
      console.log('🔍 Updating item approval:', { itemId, approvalStatus, rejectionReason });
      const { data, error } = await SupabaseDB.updateOrderItemApproval(itemId, approvalStatus, rejectionReason);
      
      if (error) {
        console.error('❌ Error updating item approval:', error);
        toast({
          variant: "destructive",
          title: "Failed to Update Item",
          description: "Unable to update item approval status. Please try again.",
        });
        return;
      }

      console.log('✅ Item approval updated successfully:', data);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items.map(item => 
            item.id === itemId 
              ? { ...item, approval_status: approvalStatus, rejection_reason: rejectionReason }
              : item
          )
        }))
      );

      toast({
        title: `Item ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: action === 'approve' 
          ? "Item has been approved."
          : "Item has been rejected with reason.",
      });

      setSelectedItem(null);
      setItemRejectionReason('');
    } catch (error) {
      console.error('❌ Error processing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while processing the item.",
      });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleApproveAllItems = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      
      console.log('🔍 Approving all items for order:', orderId);
      const { data, error } = await SupabaseDB.updateAllOrderItemsApproval(orderId, 'APPROVED');
      
      if (error) {
        console.error('❌ Error approving all items:', error);
        toast({
          variant: "destructive",
          title: "Failed to Approve All Items",
          description: "Unable to approve all items. Please try again.",
        });
        return;
      }

      console.log('✅ All items approved successfully:', data);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {
                ...order,
                order_items: order.order_items.map(item => ({
                  ...item,
                  approval_status: 'APPROVED'
                }))
              }
            : order
        )
      );

      toast({
        title: "All Items Approved",
        description: "All items in this order have been approved.",
      });
    } catch (error) {
      console.error('❌ Error approving all items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while approving all items.",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Confirmed</Badge>;
      case 'PREPARING':
        return <Badge variant="default" className="flex items-center gap-1"><Package className="h-3 w-3" />Preparing</Badge>;
      case 'READY':
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Ready</Badge>;
      case 'DELIVERED':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'COD':
        return '💵';
      case 'UPI':
        return '📱';
      case 'CARD':
        return '💳';
      case 'NETBANKING':
        return '🏦';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading orders...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Review and manage customer orders</p>
        </div>
        <Button onClick={loadOrders} variant="outline">
          Refresh Orders
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">Orders from customers will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Order #{order.id.slice(-8)}
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getPaymentMethodIcon(order.payment_method)} {order.payment_method}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {order.customer.name}</p>
                      <p><strong>Email:</strong> {order.customer.email}</p>
                      <p><strong>Phone:</strong> {order.customer.phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </h4>
                    <div className="text-sm">
                      <p>{order.delivery_address}</p>
                      <p className="text-muted-foreground mt-1">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {order.delivery_phone}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.product.image_url ? (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-lg">🍎</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{item.product.name}</h5>
                          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                          {item.approval_status && (
                            <Badge 
                              variant={
                                item.approval_status === 'APPROVED' ? 'default' :
                                item.approval_status === 'REJECTED' ? 'destructive' : 'secondary'
                              }
                              className="text-xs mt-1"
                            >
                              {item.approval_status === 'APPROVED' ? '✓ Approved' :
                               item.approval_status === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                            </Badge>
                          )}
                          {item.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">
                              Reason: {item.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        {/* Individual Item Actions */}
                        {order.status === 'PENDING_APPROVAL' && (
                          <div className="flex gap-2">
                            {item.approval_status !== 'APPROVED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleItemAction(item.id, 'approve')}
                                disabled={processingItem === item.id}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            {item.approval_status !== 'REJECTED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItem(item)}
                                disabled={processingItem === item.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Bulk Actions for Approval Requests */}
                  {order.status === 'PENDING_APPROVAL' && (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        onClick={() => handleApproveAllItems(order.id)}
                        disabled={processingOrder === order.id}
                        className="w-full"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve All Items
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Order Notes
                      </h4>
                      <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                        {order.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                {order.status === 'PENDING_APPROVAL' && (
                  <>
                    <Separator />
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleOrderAction(order.id, 'approve')}
                        disabled={processingOrder === order.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Order Request
                      </Button>
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Order Request
                      </Button>
                    </div>
                  </>
                )}

                {/* Order Status Actions */}
                {order.status === 'CONFIRMED' && (
                  <>
                    <Separator />
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleOrderAction(order.id, 'approve')}
                        disabled={processingOrder === order.id}
                        className="flex-1"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Preparing
                      </Button>
                    </div>
                  </>
                )}

                {order.status === 'PREPARING' && (
                  <>
                    <Separator />
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleOrderAction(order.id, 'approve')}
                        disabled={processingOrder === order.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Ready
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Rejection Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrder(null);
          setRejectionReason('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Order Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order request. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this order request..."
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => handleOrderAction(selectedOrder!.id, 'reject')}
                disabled={processingOrder === selectedOrder?.id || !rejectionReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                Reject Order Request
              </Button>
              <Button
                onClick={() => {
                  setSelectedOrder(null);
                  setRejectionReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Item Rejection Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null);
          setItemRejectionReason('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Item</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedItem?.product.name}". The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemRejectionReason">Reason for Rejection</Label>
              <Textarea
                id="itemRejectionReason"
                value={itemRejectionReason}
                onChange={(e) => setItemRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this item..."
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => handleItemAction(selectedItem!.id, 'reject')}
                disabled={processingItem === selectedItem?.id || !itemRejectionReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                Reject Item
              </Button>
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  setItemRejectionReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}