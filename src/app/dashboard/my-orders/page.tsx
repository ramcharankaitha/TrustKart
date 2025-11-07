'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Package, User, Phone, MapPin, CreditCard, AlertCircle, Truck, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDB } from '@/lib/supabase-db';
import { useRouter } from 'next/navigation';

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

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryTracking, setDeliveryTracking] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  // Check for delivery tracking for orders that might have delivery assigned
  useEffect(() => {
    const checkDeliveryTracking = async () => {
      const trackingMap: Record<string, any> = {};
      
      for (const order of orders) {
        // Check all orders that are past payment stage or have delivery-related statuses
        // This includes: PAID, CONFIRMED, PREPARING, READY, ASSIGNED, PICKED_UP, IN_TRANSIT
        const shouldCheckForDelivery = [
          'PAID', 
          'CONFIRMED', 
          'PREPARING', 
          'READY', 
          'ASSIGNED', 
          'PICKED_UP', 
          'IN_TRANSIT',
          'DELIVERED'
        ].includes(order.status);
        
        if (shouldCheckForDelivery) {
          try {
            console.log(`🔍 Checking delivery tracking for order ${order.id} (status: ${order.status})`);
            const response = await fetch(`/api/orders/${order.id}/tracking`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`📦 Tracking data for order ${order.id}:`, data);
              
              if (data.success && data.delivery) {
                trackingMap[order.id] = data.delivery;
                console.log(`✅ Delivery found for order ${order.id}:`, data.delivery);
              } else {
                console.log(`⚠️ No delivery data for order ${order.id}`);
              }
            } else {
              // Delivery might not exist yet, that's okay
              console.log(`⚠️ Tracking API returned ${response.status} for order ${order.id}`);
            }
          } catch (error) {
            console.error(`❌ Error checking tracking for order ${order.id}:`, error);
            // Silently fail - delivery might not exist yet
          }
        }
      }
      
      console.log('📊 Delivery tracking map:', trackingMap);
      setDeliveryTracking(trackingMap);
    };

    if (orders.length > 0) {
      checkDeliveryTracking();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(checkDeliveryTracking, 10000);
      return () => clearInterval(interval);
    }
  }, [orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        console.error('❌ No user session found');
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to view your orders.",
        });
        router.push('/login');
        return;
      }

      // Verify user is a customer, not a shopkeeper
      if (userSession.role && userSession.role.toLowerCase() === 'shopkeeper') {
        console.error('❌ User is a shopkeeper, not a customer');
        toast({
          variant: "destructive",
          title: "Wrong Page",
          description: "You are logged in as a shopkeeper. Please use the shopkeeper dashboard to view orders.",
        });
        router.push('/dashboard/orders');
        return;
      }

      console.log('🔍 Loading orders for customer:', userSession.id);
      
      // Get orders for this customer
      const { data: ordersData, error: ordersError } = await SupabaseDB.getOrdersByCustomer(userSession.id);
      
      if (ordersError) {
        console.error('❌ Error loading orders:', ordersError);
        toast({
          variant: "destructive",
          title: "Error",
          description: ordersError.message || "Failed to load orders. Please try again.",
        });
        setOrders([]);
        return;
      }

      console.log('✅ Orders loaded:', ordersData);
      setOrders(ordersData || []);
      
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load orders. Please try again.",
      });
      setOrders([]);
    } finally {
      setLoading(false);
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
      case 'PAYMENT_PENDING':
        return <Badge variant="outline" className="flex items-center gap-1"><CreditCard className="h-3 w-3" />Payment Pending</Badge>;
      case 'PAID':
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Paid</Badge>;
      case 'CONFIRMED':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Confirmed</Badge>;
      case 'PREPARING':
        return <Badge className="flex items-center gap-1 bg-blue-500"><Package className="h-3 w-3" />Preparing</Badge>;
      case 'READY':
        return <Badge className="flex items-center gap-1 bg-orange-500"><AlertCircle className="h-3 w-3" />Ready for Pickup</Badge>;
      case 'ASSIGNED':
        return <Badge className="flex items-center gap-1 bg-purple-500"><Truck className="h-3 w-3" />Delivery Assigned</Badge>;
      case 'PICKED_UP':
        return <Badge className="flex items-center gap-1 bg-yellow-500"><Package className="h-3 w-3" />Picked Up</Badge>;
      case 'IN_TRANSIT':
        return <Badge className="flex items-center gap-1 bg-blue-600"><Truck className="h-3 w-3" />In Transit</Badge>;
      case 'DELIVERED':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleProceedToPayment = (orderId: string) => {
    // Navigate to payment page
    router.push(`/payment/${orderId}`);
  };

  const handleViewOrderDetails = (orderId: string) => {
    // Navigate to order details page
    router.push(`/order-details/${orderId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading your orders...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button onClick={loadOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
              <Button onClick={() => router.push('/dashboard')} className="mt-4">
                Start Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">₹{order.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Delivery Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{order.delivery_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{order.delivery_phone}</span>
                      </div>
                      {order.notes && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                            🍎
                          </div>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                          {item.approval_status && (
                            <Badge variant="outline" className="text-xs">
                              {item.approval_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Tracking Info */}
                {deliveryTracking[order.id] ? (
                  deliveryTracking[order.id].agentAssigned ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800 dark:text-blue-300">Delivery Agent Assigned</span>
                        </div>
                        {getStatusBadge(deliveryTracking[order.id].status)}
                      </div>
                      {deliveryTracking[order.id].deliveryAgent && (
                        <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                          <p><strong>Agent:</strong> {deliveryTracking[order.id].deliveryAgent.name}</p>
                          <p><strong>Phone:</strong> {deliveryTracking[order.id].deliveryAgent.phone}</p>
                          {deliveryTracking[order.id].agentLocation && (
                            <p className="text-xs text-blue-600 dark:text-blue-500">
                              📍 Live location available - Click "Track Delivery" to view
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Waiting for delivery agent assignment...
                      </p>
                    </div>
                  )
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleViewOrderDetails(order.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  
                  {/* Track Delivery Button - Show when delivery agent is assigned */}
                  {deliveryTracking[order.id] && deliveryTracking[order.id].agentAssigned && 
                   ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(deliveryTracking[order.id].status) && (
                    <Button
                      onClick={() => handleViewOrderDetails(order.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Track Delivery
                    </Button>
                  )}
                  
                  {order.status === 'APPROVED' && (
                    <Button
                      onClick={() => handleProceedToPayment(order.id)}
                      className="flex-1"
                    >
                      Proceed to Payment
                    </Button>
                  )}
                  
                  {order.status === 'PENDING_APPROVAL' && (
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1"
                    >
                      Waiting for Approval
                    </Button>
                  )}
                  
                  {order.status === 'REJECTED' && (
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="outline"
                      className="flex-1"
                    >
                      Order New Items
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}