'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  AlertCircle,
  Navigation,
  RefreshCw,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeliveryMap } from '@/components/delivery-map';
import { LiveTrackingMap } from '@/components/live-tracking-map';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
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
  shop: {
    name: string;
    address: string;
    phone: string;
  };
  order_items: OrderItem[];
}

interface DeliveryTracking {
  id: string;
  status: string;
  agentAssigned: boolean;
  agentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  } | null;
  deliveryAgent: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
  } | null;
  deliveryLocation: {
    latitude: number;
    longitude: number;
  } | null;
  pickupLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      loadTracking();
      
      // Poll for tracking updates every 3 seconds for live tracking
      pollingIntervalRef.current = setInterval(() => {
        loadTracking();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        // Try using SupabaseDB as fallback
        const { SupabaseDB } = await import('@/lib/supabase-db');
        const { data, error } = await SupabaseDB.getOrderById(orderId);
        if (error || !data) {
          throw new Error('Failed to load order');
        }
        setOrder(data as any);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      
      if (!response.ok) {
        // If tracking not found, that's okay - order might not have delivery yet
        return;
      }
      
      const data = await response.json();
      if (data.success && data.delivery) {
        setTracking(data.delivery);
        
        // Stop polling if delivery is complete
        if (data.delivery.status === 'DELIVERED' && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'APPROVED':
      case 'CONFIRMED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Confirmed</Badge>;
      case 'PREPARING':
        return <Badge className="flex items-center gap-1 bg-blue-500"><Package className="h-3 w-3" />Preparing</Badge>;
      case 'READY':
        return <Badge className="flex items-center gap-1 bg-orange-500"><AlertCircle className="h-3 w-3" />Ready</Badge>;
      case 'ASSIGNED':
        return <Badge className="flex items-center gap-1 bg-purple-500"><Truck className="h-3 w-3" />Assigned</Badge>;
      case 'PICKED_UP':
        return <Badge className="flex items-center gap-1 bg-yellow-500"><Package className="h-3 w-3" />Picked Up</Badge>;
      case 'IN_TRANSIT':
        return <Badge className="flex items-center gap-1 bg-blue-600"><Truck className="h-3 w-3" />In Transit</Badge>;
      case 'DELIVERED':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryStatusMessage = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return "A delivery agent has been assigned to your order. They will pick up your order soon.";
      case 'PICKED_UP':
        return "Your order has been picked up and is on the way to you!";
      case 'IN_TRANSIT':
        return "Your order is on the way! You can track the delivery agent's location below.";
      case 'DELIVERED':
        return "Your order has been delivered successfully!";
      default:
        return "Waiting for delivery assignment...";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading order details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
            <Link href="/dashboard/my-orders">
              <Button>Go to My Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveDelivery = tracking && tracking.agentAssigned && ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(tracking.status);
  const showLiveTracking = hasActiveDelivery && tracking.agentLocation;

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Order Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(-8)}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Delivery Tracking */}
          {tracking && tracking.agentAssigned && (
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Live Delivery Tracking
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadTracking}
                    disabled={trackingLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${trackingLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Status */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-800 dark:text-blue-300">
                      {getDeliveryStatusMessage(tracking.status)}
                    </span>
                    {getStatusBadge(tracking.status)}
                  </div>
                  
                  {/* Delivery Agent Info */}
                  {tracking.deliveryAgent && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Agent:</span>
                        <span>{tracking.deliveryAgent.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Phone:</span>
                        <a href={`tel:${tracking.deliveryAgent.phone}`} className="text-blue-600 hover:underline">
                          {tracking.deliveryAgent.phone}
                        </a>
                      </div>
                      {tracking.deliveryAgent.vehicleType && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Vehicle:</span>
                          <span>{tracking.deliveryAgent.vehicleType}</span>
                        </div>
                      )}
                      {tracking.agentLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Last Updated:</span>
                          <span>{new Date(tracking.agentLocation.lastUpdated).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Tracking Map - Shows vehicle moving in real-time */}
                {showLiveTracking && tracking.agentLocation && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600 animate-pulse" />
                        <h3 className="font-semibold text-lg">Live Vehicle Tracking</h3>
                        <Badge className="bg-green-500 text-white">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                          LIVE
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadTracking}
                        disabled={trackingLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${trackingLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <LiveTrackingMap
                      agentLocation={tracking.agentLocation ? {
                        latitude: tracking.agentLocation.latitude,
                        longitude: tracking.agentLocation.longitude,
                        label: 'Delivery Agent'
                      } : null}
                      deliveryLocation={tracking.deliveryLocation ? {
                        latitude: tracking.deliveryLocation.latitude,
                        longitude: tracking.deliveryLocation.longitude,
                        label: 'Your Location'
                      } : null}
                      pickupLocation={tracking.pickupLocation ? {
                        latitude: tracking.pickupLocation.latitude,
                        longitude: tracking.pickupLocation.longitude,
                        label: 'Pickup Location'
                      } : null}
                    />
                  </div>
                )}

                {/* No Live Location Yet */}
                {tracking.agentAssigned && !tracking.agentLocation && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Delivery agent is assigned but location is not available yet. Please check back in a moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {item.quantity}</p>
                    <p className="text-lg font-semibold text-green-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shop Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Shop Name:</strong> {order.shop.name}</p>
                <p><strong>Address:</strong> {order.shop.address}</p>
                <p><strong>Phone:</strong> {order.shop.phone}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(order.total_amount - 50).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹50.00</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{order.delivery_address}</p>
              <p className="text-sm text-muted-foreground">
                <Phone className="h-3 w-3 inline mr-1" />
                {order.delivery_phone}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard/my-orders" className="block">
              <Button variant="outline" className="w-full">
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

