'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Package, User, Phone, MapPin, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SupabaseDB } from '@/lib/supabase-db';

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

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const resolvedParams = use(params);

  useEffect(() => {
    loadOrder();
  }, [resolvedParams.id]);

  const loadOrder = async () => {
    try {
      console.log('🔍 Loading order:', resolvedParams.id);
      const { data, error } = await SupabaseDB.getOrderById(resolvedParams.id);
      
      if (error) {
        console.error('❌ Error loading order:', error);
        setError('Failed to load order details');
        return;
      }

      if (data) {
        console.log('✅ Order loaded:', data);
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('❌ Error loading order:', err);
      setError('Failed to load order details');
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
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (error || !order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              {error || 'Order not found'}
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Request Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order Status</h3>
            {getStatusBadge(order.status)}
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
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
              <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.delivery_address}</span>
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
            <h3 className="text-lg font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      🍎
                    </div>
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
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

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={() => router.push('/dashboard')} className="flex-1">
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/cart')} variant="outline" className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}