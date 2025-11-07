
'use client';

import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, CreditCard, Landmark, Wallet, ArrowLeft, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SupabaseDB } from '@/lib/supabase-db';

interface SavedAddress {
  id: string;
  label?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export function CartSheet() {
  const { cart, updateQuantity, getProductQuantity, clearCart } = useCart();
  const [view, setView] = useState<'cart' | 'checkout'>('cart');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const { toast } = useToast();
  const router = useRouter();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    deliveryInstructions: ''
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 5.00 : 0;
  const total = subtotal + shippingFee;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch saved addresses when checkout view is accessed
  useEffect(() => {
    if (view === 'checkout') {
      const fetchAddresses = async () => {
        try {
          setLoadingAddresses(true);
          const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
          if (!userSession.id) return;

          const response = await fetch(`/api/customer/addresses?customerId=${userSession.id}`);
          const result = await response.json();

          if (result.success && result.addresses?.length > 0) {
            setSavedAddresses(result.addresses);
            const defaultAddress = result.addresses.find((addr: SavedAddress) => addr.is_default);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              setDeliveryInfo({
                name: defaultAddress.full_name || '',
                phone: defaultAddress.phone || '',
                address: `${defaultAddress.address_line1}${defaultAddress.address_line2 ? ', ' + defaultAddress.address_line2 : ''}`,
                city: defaultAddress.city,
                state: defaultAddress.state,
                pincode: defaultAddress.pincode,
                deliveryInstructions: ''
              });
            } else {
              setSelectedAddressId(result.addresses[0].id);
              const firstAddr = result.addresses[0];
              setDeliveryInfo({
                name: firstAddr.full_name || '',
                phone: firstAddr.phone || '',
                address: `${firstAddr.address_line1}${firstAddr.address_line2 ? ', ' + firstAddr.address_line2 : ''}`,
                city: firstAddr.city,
                state: firstAddr.state,
                pincode: firstAddr.pincode,
                deliveryInstructions: ''
              });
            }
            // Pre-fill from user session if available
            if (userSession.name && !deliveryInfo.name) {
              setDeliveryInfo(prev => ({ ...prev, name: userSession.name || '' }));
            }
            if (userSession.phone && !deliveryInfo.phone) {
              setDeliveryInfo(prev => ({ ...prev, phone: userSession.phone || '' }));
            }
          } else {
            // No saved addresses, get from user session
            const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
            if (userSession.name) {
              setDeliveryInfo(prev => ({ ...prev, name: userSession.name || '' }));
            }
            if (userSession.phone) {
              setDeliveryInfo(prev => ({ ...prev, phone: userSession.phone || '' }));
            }
            if (userSession.address) {
              setDeliveryInfo(prev => ({ ...prev, address: userSession.address || '' }));
            }
            setUseSavedAddress(false);
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
          // Pre-fill from user session on error
          const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
          if (userSession.name) {
            setDeliveryInfo(prev => ({ ...prev, name: userSession.name || '' }));
          }
          if (userSession.phone) {
            setDeliveryInfo(prev => ({ ...prev, phone: userSession.phone || '' }));
          }
          if (userSession.address) {
            setDeliveryInfo(prev => ({ ...prev, address: userSession.address || '' }));
          }
          setUseSavedAddress(false);
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchAddresses();
    }
  }, [view]);

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setDeliveryInfo({
        name: address.full_name || '',
        phone: address.phone || '',
        address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        deliveryInstructions: ''
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart Empty",
        description: "Please add items to your cart before sending order request.",
      });
      return;
    }

    // Validate delivery address
    if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state || !deliveryInfo.pincode) {
      toast({
        variant: "destructive",
        title: "Delivery Address Required",
        description: "Please provide complete delivery address (address, city, state, and pincode).",
      });
      return;
    }

    if (!deliveryInfo.phone) {
      toast({
        variant: "destructive",
        title: "Contact Phone Required",
        description: "Please provide a contact phone number for delivery.",
      });
      return;
    }

    try {
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      console.log('🔍 User session:', userSession);
      
      if (!userSession.id) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to send order request.",
        });
        return;
      }

      // Get shop information from the first item (assuming all items are from the same shop)
      const firstItem = cart[0];
      const shopId = firstItem.product.shopId;
      console.log('🔍 First item:', firstItem);
      console.log('🔍 Shop ID:', shopId);
      
      if (!shopId) {
        toast({
          variant: "destructive",
          title: "Invalid Shop",
          description: "Unable to determine shop for this order. Please try again.",
        });
        return;
      }

      // Build full delivery address
      const fullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.state} - ${deliveryInfo.pincode}`;
      
      // Create order request in database
      const orderRequestData = {
        customer_id: userSession.id,
        shop_id: shopId,
        total_amount: total, // Total including shipping
        subtotal: subtotal, // Subtotal without shipping
        delivery_address: fullAddress,
        delivery_phone: deliveryInfo.phone,
        notes: deliveryInfo.deliveryInstructions || "Order request from cart",
        status: 'PENDING_APPROVAL',
        request_type: 'ORDER_REQUEST'
      };

      console.log('🔍 Creating order request with data:', orderRequestData);

      // Create order request in database
      const { data: orderRequest, error: orderRequestError } = await SupabaseDB.createOrder(orderRequestData);
      
      if (orderRequestError) {
        console.error('❌ Order request creation error:', orderRequestError);
        console.error('❌ Error details:', JSON.stringify(orderRequestError, null, 2));
        toast({
          variant: "destructive",
          title: "Order Request Failed",
          description: `Failed to create order request: ${orderRequestError.message || 'Unknown error'}`,
        });
        return;
      }

      console.log('✅ Order request created successfully:', orderRequest);

      // Create order request items
      for (const item of cart) {
        const orderItemData = {
          order_id: orderRequest.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          approval_status: 'PENDING'
        };

        console.log('🔍 Creating order item:', orderItemData);

        const { error: itemError } = await SupabaseDB.createOrderItem(orderItemData);
        
        if (itemError) {
          console.error('❌ Order item creation error:', itemError);
          console.error('❌ Item error details:', JSON.stringify(itemError, null, 2));
          toast({
            variant: "destructive",
            title: "Order Items Failed",
            description: `Failed to add item ${item.product.name}: ${itemError.message || 'Unknown error'}`,
          });
        } else {
          console.log('✅ Order item created successfully:', item.product.name);
        }
      }

      // Clear cart
      clearCart();
      setView('cart');

      toast({
        title: "Order Request Sent!",
        description: "Your order request has been sent to the shopkeeper for approval. You'll be notified once it's reviewed.",
      });

      // Close the sheet
      const closeButton = document.querySelector('[data-radix-dialog-close]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }

      // Redirect to order request confirmation page
      router.push(`/order-request-confirmation/${orderRequest.id}`);

    } catch (error) {
      console.error('❌ Order request error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Order Request Failed",
        description: `An error occurred: ${error.message || 'Unknown error'}`,
      });
    }
  };


  const CartView = () => (
    <>
      <SheetHeader>
        <SheetTitle>My Cart ({cartItemCount})</SheetTitle>
      </SheetHeader>
      {cart.length > 0 ? (
        <>
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 py-4">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                    data-ai-hint={item.product.imageHint}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.stockQty}g</p>
                    <p className="text-sm font-semibold mt-1">₹{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between h-9 w-24 text-primary border border-primary rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-8 text-primary"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product)}
                      >
                        {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
                      </Button>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-8 text-primary"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product)}
                        disabled={item.quantity >= item.product.stockQty}
                        title={item.quantity >= item.product.stockQty ? `Only ${item.product.stockQty} items available` : 'Add more'}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Stock Warning */}
                    {item.quantity >= item.product.stockQty && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Max: {item.product.stockQty} available
                      </p>
                    )}
                    {item.quantity > item.product.stockQty && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Exceeds stock!
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="mt-auto">
            <div className="w-full space-y-4">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
               <Button className="w-full" onClick={() => setView('checkout')}>Proceed to Checkout</Button>
            </div>
          </SheetFooter>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Image src="https://picsum.photos/seed/emptycart/200/200" alt="Empty cart" width={150} height={150} data-ai-hint="empty cart" />
          <h3 className="text-xl font-semibold">Your cart is empty</h3>
          <p className="text-muted-foreground">Looks like you haven’t added anything to your cart yet.</p>
           <SheetClose asChild>
             <Button>Continue Shopping</Button>
          </SheetClose>
        </div>
      )}
    </>
  );

  const CheckoutView = () => (
    <>
      <SheetHeader className="flex flex-row items-center gap-4">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setView('cart')}>
          <ArrowLeft />
        </Button>
        <SheetTitle>Order Request</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 -mx-6">
        <div className="px-6 space-y-6">
          {/* Delivery Address Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Delivery Address</h3>
            </div>

            {/* Saved Addresses */}
            {loadingAddresses ? (
              <div className="text-sm text-muted-foreground">Loading addresses...</div>
            ) : savedAddresses.length > 0 && useSavedAddress ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Saved Address</Label>
                <RadioGroup value={selectedAddressId} onValueChange={handleSelectAddress}>
                  {savedAddresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{address.full_name}</div>
                        <div className="text-sm text-muted-foreground">{address.phone}</div>
                        <div className="text-sm text-muted-foreground">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {address.city}, {address.state} - {address.pincode}
                        </div>
                        {address.is_default && (
                          <span className="text-xs text-primary font-medium">Default</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setUseSavedAddress(false);
                    setSelectedAddressId('');
                  }}
                >
                  Use Different Address
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setUseSavedAddress(true);
                    if (savedAddresses.length > 0) {
                      const defaultAddr = savedAddresses.find(a => a.is_default) || savedAddresses[0];
                      if (defaultAddr) {
                        handleSelectAddress(defaultAddr.id);
                      }
                    }
                  }}
                  disabled={savedAddresses.length === 0}
                >
                  {savedAddresses.length > 0 ? 'Use Saved Address' : 'No Saved Addresses'}
                </Button>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="deliveryName" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryName"
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryPhone" className="text-sm font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryPhone"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress" className="text-sm font-medium">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="House/Flat No., Building, Street"
                      className="mt-1"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="deliveryCity" className="text-sm font-medium">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="deliveryCity"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryState" className="text-sm font-medium">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="deliveryState"
                        value={deliveryInfo.state}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deliveryPincode" className="text-sm font-medium">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryPincode"
                      value={deliveryInfo.pincode}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Enter pincode"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryInstructions" className="text-sm font-medium">
                      Delivery Instructions (Optional)
                    </Label>
                    <Textarea
                      id="deliveryInstructions"
                      value={deliveryInfo.deliveryInstructions}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                      placeholder="Any special instructions for delivery"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>₹{shippingFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Order Request Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold">Order Request Process</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              Your order request will be sent to the shopkeeper for approval. 
              You'll be notified once it's approved and can then proceed to payment.
            </p>
          </div>
        </div>
      </ScrollArea>
      <Separator />
      <SheetFooter className="mt-auto">
        <Button 
          className="w-full" 
          onClick={handlePlaceOrder}
          disabled={loadingAddresses}
        >
          Send Order Request (₹{total.toFixed(2)})
        </Button>
      </SheetFooter>
    </>
  );

  return (
    <SheetContent className="flex flex-col" onPointerDownOutside={(e) => {
      // Prevent closing the sheet when in checkout view
      if (view === 'checkout') e.preventDefault();
    }}>
      {view === 'cart' ? <CartView /> : <CheckoutView />}
    </SheetContent>
  );
}
