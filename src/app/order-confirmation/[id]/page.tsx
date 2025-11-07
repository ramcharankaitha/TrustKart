'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Package, User, Phone, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDB } from '@/lib/supabase-db';
import Image from 'next/image';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    price: number;
    image_url?: string;
    description?: string;
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

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading order:', orderId);
      
      const { data, error } = await SupabaseDB.getOrderById(orderId);
      
      if (error) {
        console.error('❌ Error loading order:', error);
        toast({
          variant: "destructive",
          title: "Order Not Found",
          description: "Unable to find the order. Please check the order ID.",
        });
        return;
      }

      console.log('✅ Order loaded:', data);
      setOrder(data);
    } catch (error) {
      console.error('❌ Error loading order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while loading the order.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
      case 'CONFIRMED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Confirmed</Badge>;
      case 'PREPARING':
        return <Badge variant="default" className="flex items-center gap-1"><Package className="h-3 w-3" />Preparing</Badge>;
      case 'READY':
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Ready for Pickup</Badge>;
      case 'DELIVERED':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return "Your order has been placed and is waiting for shopkeeper approval. You'll be notified once it's confirmed.";
      case 'CONFIRMED':
        return "Great! Your order has been confirmed by the shopkeeper. They will start preparing your items.";
      case 'PREPARING':
        return "Your order is being prepared. You'll be notified when it's ready.";
      case 'READY':
        return "Your order is ready! You can now proceed with payment and pickup/delivery.";
      case 'DELIVERED':
        return "Your order has been delivered successfully. Thank you for your business!";
      case 'CANCELLED':
        return "Your order has been cancelled. Please contact the shopkeeper for more information.";
      default:
        return "Order status unknown.";
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
      <div className="container mx-auto p-8 max-w-4xl">
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
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Order Status Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Order Confirmation</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(-8)}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">{getStatusMessage(order.status)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
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
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🍎</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    {item.product.description && (
                      <p className="text-sm text-muted-foreground">{item.product.description}</p>
                    )}
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

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
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

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPaymentMethodIcon(order.payment_method)}</span>
                <span className="font-medium">{order.payment_method}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium">{order.payment_status}</span>
              </p>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
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
            <Link href="/dashboard" className="block">
              <Button className="w-full">
                Continue Shopping
              </Button>
            </Link>
            
            {order.status === 'READY' && order.payment_status === 'PENDING' && (
              <Button variant="outline" className="w-full">
                Proceed to Payment
              </Button>
            )}
            
            <Button variant="outline" className="w-full">
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
