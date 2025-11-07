'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';
import Image from 'next/image';
import Link from 'next/link';

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

export default function ApprovalConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading approval request:', orderId);
      const { data, error } = await SupabaseDB.getOrderById(orderId);
      
      if (error) {
        console.error('❌ Error loading order:', error);
        setError('Failed to load approval request details.');
        return;
      }

      console.log('✅ Order loaded:', data);
      setOrder(data);
    } catch (error) {
      console.error('❌ Error loading order:', error);
      setError('An error occurred while loading the approval request.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
      case 'CONFIRMED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemStatusBadge = (approvalStatus?: string) => {
    if (!approvalStatus) return null;
    
    switch (approvalStatus) {
      case 'APPROVED':
        return <Badge variant="default" className="text-xs">✓ Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">✗ Rejected</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="text-xs">⏳ Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{approvalStatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading approval request...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Request</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'Approval request not found.'}
              </p>
              <Button onClick={loadOrder} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Approval Request #{order.id.slice(-8)}</span>
            {getStatusBadge(order.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-semibold">Approval Request Sent Successfully!</h3>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your items have been sent to <strong>{order.shop.name}</strong> for approval. 
              You'll be notified once the shopkeeper reviews your request.
            </p>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Information
              </h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {order.customer.name}</p>
                <p><strong>Email:</strong> {order.customer.email}</p>
                <p><strong>Phone:</strong> {order.customer.phone}</p>
              </div>
            </div>

            {/* Delivery Information */}
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
              Requested Items
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
                    {getItemStatusBadge(item.approval_status)}
                    {item.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Rejection Reason:</strong> {item.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Special Instructions
                </h4>
                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          {/* Total */}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-xl font-bold">₹{order.total_amount.toFixed(2)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button asChild className="flex-1">
              <Link href="/dashboard/my-orders">
                View All Orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The shopkeeper will review each item individually</li>
              <li>• You'll receive notifications for approved/rejected items</li>
              <li>• Once all items are reviewed, you can proceed with payment</li>
              <li>• You can track the status in "My Orders" section</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
