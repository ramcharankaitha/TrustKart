'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, CreditCard, Wallet, MapPin, Package, Clock, XCircle, AlertTriangle } from 'lucide-react';
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

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const resolvedParams = use(params);

  useEffect(() => {
    loadOrder();
  }, [resolvedParams.id]);

  const loadOrder = async () => {
    try {
      console.log('🔍 Loading order for payment:', resolvedParams.id);
      const { data, error } = await SupabaseDB.getOrderById(resolvedParams.id);
      
      if (error) {
        console.error('❌ Error loading order:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load order details.",
        });
        return;
      }

      if (!data) {
        toast({
          variant: "destructive",
          title: "Order Not Found",
          description: "The order you're looking for doesn't exist.",
        });
        return;
      }

      console.log('🔍 Order status:', data.status);
      console.log('🔍 Full order data:', data);

      // Handle cancelled orders
      if (data.status === 'CANCELLED') {
        toast({
          variant: "destructive",
          title: "Order Cancelled",
          description: data.cancellation_reason || "This order has been cancelled.",
        });
        router.push('/dashboard/my-orders');
        return;
      }

      // Handle completed/delivered orders
      if (data.status === 'PAID' || data.status === 'PREPARING' || data.status === 'READY' || data.status === 'DELIVERED') {
        toast({
          variant: "default",
          title: "Order Already Processed",
          description: `This order has already been ${data.status.toLowerCase()}. Payment is not needed.`,
        });
        router.push('/dashboard/my-orders');
        return;
      }

      // Allow payment page for APPROVED, PAYMENT_PENDING, PENDING_APPROVAL statuses
      // PENDING_APPROVAL is included in case shopkeeper approves but status hasn't updated yet
      const allowedStatuses = ['APPROVED', 'PAYMENT_PENDING', 'PENDING_APPROVAL'];
      
      if (!allowedStatuses.includes(data.status)) {
        console.error('❌ Order status not allowed for payment:', data.status);
        toast({
          variant: "destructive",
          title: "Order Not Available",
          description: `This order cannot be paid for at this time. Current status: ${data.status || 'Unknown'}`,
        });
        router.push('/dashboard/my-orders');
        return;
      }

      // If order is PENDING_APPROVAL, show a message but still allow viewing
      if (data.status === 'PENDING_APPROVAL') {
        toast({
          variant: "default",
          title: "Order Pending Approval",
          description: "This order is still waiting for shopkeeper approval. Payment will be available once approved.",
        });
      }

      console.log('✅ Order loaded for payment:', data);
      setOrder(data);
      setDeliveryAddress(data.delivery_address);
      setDeliveryPhone(data.delivery_phone);
      
    } catch (error) {
      console.error('❌ Error loading order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    try {
      setProcessing(true);
      
      console.log('🔍 Processing payment for order:', order.id);
      
      // Update order status to PAID
      const { data: updatedOrder, error: updateError } = await SupabaseDB.updateOrderStatus(
        order.id, 
        'PAID', 
        `Payment completed via ${paymentMethod}. Delivery address: ${deliveryAddress}`
      );
      
      if (updateError) {
        console.error('❌ Error updating order status:', updateError);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Failed to process payment. Please try again.",
        });
        return;
      }

      console.log('✅ Payment processed successfully:', updatedOrder);
      
      // Verify order was updated before proceeding
      if (!updatedOrder) {
        console.error('❌ Order status update returned no data');
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Failed to update order status. Please contact support.",
        });
        return;
      }
      
      // Update order with delivery address if changed
      if (deliveryAddress !== order.delivery_address || deliveryPhone !== order.delivery_phone) {
        try {
          const addressUpdate = await SupabaseDB.updateOrderStatus(
            order.id,
            'PAID', // Keep status as PAID
            `Payment completed via ${paymentMethod}. Updated delivery address: ${deliveryAddress}`
          );
          // Note: Address update should happen through order update, but we're handling it via notes for now
          console.log('📝 Delivery address updated in order notes');
          
          // Small delay to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (updateError) {
          console.warn('⚠️ Could not update delivery address:', updateError);
        }
      }
      
      // Small delay to ensure order status is committed to database
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create delivery assignment automatically after payment with location mapping
      try {
        console.log('🚚 Creating delivery assignment with location mapping...');
        console.log('🔍 Order ID for delivery creation:', order.id);
        
        const deliveryResponse = await fetch(`/api/orders/${order.id}/create-delivery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const deliveryResult = await deliveryResponse.json();
        if (deliveryResult.success) {
          console.log('✅ Delivery assignment created with locations:', {
            deliveryId: deliveryResult.delivery?.id,
            hasPickupLocation: !!(deliveryResult.delivery?.pickup_latitude && deliveryResult.delivery?.pickup_longitude),
            hasDeliveryLocation: !!(deliveryResult.delivery?.delivery_latitude && deliveryResult.delivery?.delivery_longitude),
            pickupCoords: deliveryResult.delivery?.pickup_latitude && deliveryResult.delivery?.pickup_longitude 
              ? `${deliveryResult.delivery.pickup_latitude}, ${deliveryResult.delivery.pickup_longitude}` 
              : 'Not available',
            deliveryCoords: deliveryResult.delivery?.delivery_latitude && deliveryResult.delivery?.delivery_longitude
              ? `${deliveryResult.delivery.delivery_latitude}, ${deliveryResult.delivery.delivery_longitude}`
              : 'Not available',
            assignedAgent: deliveryResult.delivery?.delivery_agent_id || 'Will be assigned soon'
          });
          
          const hasAgent = deliveryResult.delivery?.delivery_agent_id;
          toast({
            title: "Payment Successful! ✅",
            description: hasAgent 
              ? "Payment processed and delivery assigned to a delivery agent. You'll receive updates on your order status."
              : "Payment processed and delivery request created. A delivery agent will be assigned soon.",
          });
        } else {
          console.warn('⚠️ Could not create delivery assignment:', deliveryResult.error);
          const errorMessage = deliveryResult.error || 'Unknown error';
          const isSchemaError = errorMessage.includes('column') || errorMessage.includes('does not exist');
          
          toast({
            title: "Payment Successful! ⚠️",
            description: isSchemaError 
              ? "Payment processed. Database setup required - please contact support to complete delivery setup."
              : `Payment processed. Delivery assignment issue: ${errorMessage}. Please contact support.`,
            variant: "default",
          });
        }
      } catch (deliveryError) {
        console.error('❌ Error creating delivery assignment:', deliveryError);
        toast({
          title: "Payment Successful!",
          description: "Payment processed. Delivery assignment creation failed. Please contact support if delivery agent is not assigned.",
          variant: "default",
        });
      }

      // Redirect to order confirmation
      router.push(`/payment-success/${order.id}`);
      
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "An error occurred while processing payment. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancellationReason.trim()) {
      toast({
        variant: "destructive",
        title: "Cancellation Reason Required",
        description: "Please provide a reason for cancelling the order.",
      });
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancellationReason: cancellationReason.trim(),
          cancelledBy: 'customer', // Track that customer cancelled
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Order Cancelled",
          description: "Your order has been cancelled successfully.",
        });

        // Close dialog and redirect
        setShowCancelDialog(false);
        setCancellationReason('');
        
        // Redirect to orders page
        router.push('/dashboard/my-orders');
      } else {
        toast({
          variant: "destructive",
          title: "Cancellation Failed",
          description: result.error || "Failed to cancel order. Please try again.",
        });
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while cancelling the order. Please try again.",
      });
    } finally {
      setCancelling(false);
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

  if (!order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Order not found or not approved
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => router.push('/dashboard/my-orders')}>
                Back to My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className="flex items-center gap-1 bg-green-500">
                <CheckCircle className="h-3 w-3" />
                Approved
              </Badge>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
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

            {/* Pricing */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{(order.total_amount - order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delivery Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Information</h3>
              
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="deliveryPhone">Contact Phone</Label>
                <Input
                  id="deliveryPhone"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  placeholder="Enter contact phone"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Cash on Delivery
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Online Payment (Coming Soon)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Button - Only show if order is APPROVED or PAYMENT_PENDING */}
            {(order.status === 'APPROVED' || order.status === 'PAYMENT_PENDING') && (
              <Button
                onClick={handlePayment}
                disabled={processing || !deliveryAddress.trim() || !deliveryPhone.trim()}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Payment - ₹{order.total_amount.toFixed(2)}
                  </>
                )}
              </Button>
            )}

            {/* Show message if order is pending approval */}
            {order.status === 'PENDING_APPROVAL' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Waiting for Approval</p>
                    <p className="text-sm">This order is pending shopkeeper approval. Payment will be available once approved.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Order Button - Only show for APPROVED or PAYMENT_PENDING orders */}
            {(order.status === 'APPROVED' || order.status === 'PAYMENT_PENDING') && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            )}

            {/* Order Info */}
            <div className="text-sm text-muted-foreground">
              <p>Order ID: {order.id.slice(-8)}</p>
              <p>Ordered on: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Cancellation Reason *</Label>
              <Textarea
                id="cancellationReason"
                placeholder="e.g., Changed my mind, Found better price, No longer needed..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This helps us improve our service. Your reason will be shared with the shopkeeper.
              </p>
            </div>

            {/* Common Reasons */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Select (Optional)</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Changed my mind',
                  'Found better price elsewhere',
                  'No longer needed',
                  'Delivery location changed',
                  'Payment issues',
                  'Other'
                ].map((reason) => (
                  <Button
                    key={reason}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => setCancellationReason(reason)}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellationReason('');
              }}
              disabled={cancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelling || !cancellationReason.trim()}
            >
              {cancelling ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
