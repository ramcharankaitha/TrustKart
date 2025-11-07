'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Clock, MapPin, Phone, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDB } from '@/lib/supabase-db';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  approval_status?: string;
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

export default function PaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const resolvedParams = use(params);

  useEffect(() => {
    loadOrder();
  }, [resolvedParams.id]);

  const loadOrder = async () => {
    try {
      console.log('🔍 Loading order for success page:', resolvedParams.id);
      const { data, error } = await SupabaseDB.getOrderById(resolvedParams.id);
      
      if (error) {
        console.error('❌ Error loading order:', error);
        return;
      }

      if (data) {
        console.log('✅ Order loaded for success page:', data);
        setOrder(data);
      }
      
    } catch (error) {
      console.error('❌ Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading order details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Completed</h2>
              <p className="text-muted-foreground">
                Your payment has been processed successfully. The shopkeeper will now prepare your order.
              </p>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{order.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className="flex items-center gap-1 bg-green-500">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Delivery Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{order.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{order.delivery_phone}</span>
                    </div>
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
                      <div className="font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <div className="space-y-2 text-blue-700 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>The shopkeeper will prepare your order</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>You'll be notified when your order is ready</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Your order will be delivered to the specified address</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={() => router.push('/dashboard/my-orders')} className="flex-1">
              View My Orders
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
