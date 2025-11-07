'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus, ShoppingCart, CreditCard, MapPin, User, Phone, Mail, CheckCircle, Clock, AlertCircle, Star, Home, Briefcase, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { SupabaseDB } from '@/lib/supabase-db';

interface SavedAddress {
  id: string;
  label?: string;
  full_name?: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export default function CartPage() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    deliveryInstructions: ''
  });

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Get customer ID
  const getCustomerId = () => {
    if (typeof window === 'undefined') return null;
    const sessionData = sessionStorage.getItem('userSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        return session.id;
      } catch (e) {
        return null;
      }
    }
    return localStorage.getItem('userId');
  };

  // Handle address selection
  const handleSelectAddress = (addressId: string, addressList?: SavedAddress[]) => {
    const addresses = addressList || savedAddresses;
    setSelectedAddressId(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setDeliveryInfo({
        name: address.full_name || '',
        phone: address.phone || '',
        email: '',
        address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        deliveryInstructions: ''
      });
    }
  };

  // Fetch saved addresses
  useEffect(() => {
    const customerId = getCustomerId();
    if (!customerId) {
      setLoadingAddresses(false);
      return;
    }

    const fetchAddresses = async () => {
      try {
        const response = await fetch(`/api/customer/addresses?customerId=${customerId}`);
        const result = await response.json();

        if (result.success && result.addresses?.length > 0) {
          setSavedAddresses(result.addresses);
          
          // Auto-select default address if available
          const defaultAddress = result.addresses.find((addr: SavedAddress) => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            handleSelectAddress(defaultAddress.id, result.addresses);
          } else {
            setSelectedAddressId(result.addresses[0].id);
            handleSelectAddress(result.addresses[0].id, result.addresses);
          }
        } else {
          setUseSavedAddress(false);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setUseSavedAddress(false);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, []);

  const getLabelIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'work':
      case 'office':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem) {
      updateQuantity(productId, newQuantity, cartItem.product);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleSendOrderRequest = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart Empty",
        description: "Please add items to your cart before sending order request.",
      });
      return;
    }

    // Validate address selection - MANDATORY
    if (savedAddresses.length > 0 && useSavedAddress) {
      // If saved addresses exist and user chose to use saved address, must select one
      if (!selectedAddressId || selectedAddressId.trim() === '') {
        toast({
          variant: "destructive",
          title: "Address Required",
          description: "Please select a delivery address from your saved addresses.",
        });
        return;
      }
    } else {
      // If using manual address, validate all required fields
      const requiredFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
      const missingFields = requiredFields.filter(field => {
        const value = deliveryInfo[field as keyof typeof deliveryInfo];
        return !value || (typeof value === 'string' && value.trim() === '');
      });
      
      if (missingFields.length > 0) {
        const fieldNames: Record<string, string> = {
          name: 'Full Name',
          phone: 'Phone Number',
          address: 'Address',
          city: 'City',
          state: 'State',
          pincode: 'Pincode'
        };
        const missingFieldNames = missingFields.map(f => fieldNames[f] || f);
        toast({
          variant: "destructive",
          title: "Address Information Required",
          description: `Please fill in all required address fields: ${missingFieldNames.join(', ')}`,
        });
        return;
      }
    }

    // Validate payment method
    if (!paymentMethod || paymentMethod.trim() === '') {
      toast({
        variant: "destructive",
        title: "Payment Method Required",
        description: "Please select a payment method.",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
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
      
      // Create order request in database
      const orderRequestData = {
        customer_id: userSession.id,
        shop_id: shopId,
        total_amount: calculateTotal() + 50, // Including shipping
        subtotal: calculateTotal(), // Subtotal without shipping
        delivery_address: `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.state} - ${deliveryInfo.pincode}`,
        delivery_phone: deliveryInfo.phone,
        notes: deliveryInfo.deliveryInstructions || '',
        status: 'PENDING_APPROVAL', // Order request status
        request_type: 'ORDER_REQUEST' // Distinguish from direct orders
      };

      console.log('🔍 Creating order request with data:', orderRequestData);

      // Create order request in database
      const { data: orderRequest, error: orderRequestError } = await SupabaseDB.createOrder(orderRequestData);
      
      if (orderRequestError) {
        console.error('❌ Order request creation error:', orderRequestError);
        toast({
          variant: "destructive",
          title: "Order Request Failed",
          description: "Failed to create order request. Please try again.",
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
          approval_status: 'PENDING' // Individual product approval status
        };

        const { error: itemError } = await SupabaseDB.createOrderItem(orderItemData);
        
        if (itemError) {
          console.error('❌ Order item creation error:', itemError);
          toast({
            variant: "destructive",
            title: "Order Items Failed",
            description: "Failed to add some items to the order request.",
          });
        }
      }

      // Clear cart
      clearCart();

      toast({
        title: "Order Request Sent!",
        description: "Your order request has been sent to the shopkeeper for approval. You'll be notified once it's reviewed.",
      });

      // Redirect to order request confirmation page
      window.location.href = `/order-request-confirmation/${orderRequest.id}`;

    } catch (error) {
      console.error('❌ Order request error:', error);
      toast({
        variant: "destructive",
        title: "Order Request Failed",
        description: "An error occurred while sending order request. Please try again.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };


  if (cart.length === 0) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started!</p>
            <Link href="/dashboard">
              <Button>Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🍎</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.description}</p>
                    <p className="text-lg font-semibold text-green-600">₹{item.product.price}</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQty}
                        title={item.quantity >= item.product.stockQty ? `Only ${item.product.stockQty} items available` : 'Add more'}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Stock Warning */}
                    {item.quantity >= item.product.stockQty && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Max: {item.product.stockQty} available
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Checkout */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹50.00</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{(calculateTotal() + 50).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
                {savedAddresses.length > 0 && (
                  <Link href="/dashboard/addresses">
                    <Button variant="outline" size="sm">
                      Manage Addresses
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address Selection Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <strong>Delivery Address Required:</strong> You must provide a delivery address to place your order.
                </p>
              </div>

              {/* Saved Addresses Selection */}
              {!loadingAddresses && savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Select Delivery Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      id="useSaved"
                      checked={useSavedAddress}
                      onChange={() => setUseSavedAddress(true)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="useSaved" className="cursor-pointer font-normal">
                      Use Saved Address
                    </Label>
                  </div>
                  
                  {useSavedAddress && (
                    <div className="space-y-1">
                      <Select value={selectedAddressId} onValueChange={handleSelectAddress}>
                        <SelectTrigger className={!selectedAddressId ? "border-red-300 focus:border-red-500" : ""}>
                          <SelectValue placeholder="Select a delivery address *" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              <div className="flex items-center gap-2">
                                {getLabelIcon(address.label)}
                                <span>{address.label || 'Address'}</span>
                                {address.is_default && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                )}
                                <span className="text-muted-foreground ml-2">
                                  {address.city}, {address.state}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedAddressId && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Please select a delivery address
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="radio"
                      id="useManual"
                      checked={!useSavedAddress}
                      onChange={() => setUseSavedAddress(false)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="useManual" className="cursor-pointer font-normal">
                      Enter New Address
                    </Label>
                  </div>
                </div>
              )}

              {(!savedAddresses.length || !useSavedAddress) && (
                <>
                  {savedAddresses.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-700">
                        Entering a new address. All fields marked with <span className="text-red-500">*</span> are required.
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <strong>Required:</strong> Please provide complete delivery address information
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1">
                        Full Name
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={deliveryInfo.name}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})}
                        placeholder="Enter your name"
                        className={!deliveryInfo.name ? "border-red-300 focus:border-red-500" : ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        Phone Number
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={deliveryInfo.phone}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                        placeholder="Enter phone number"
                        className={!deliveryInfo.phone ? "border-red-300 focus:border-red-500" : ""}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-1">
                      Delivery Address
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                      placeholder="Enter your complete address"
                      rows={3}
                      className={!deliveryInfo.address ? "border-red-300 focus:border-red-500" : ""}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="flex items-center gap-1">
                        City
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                        placeholder="City"
                        className={!deliveryInfo.city ? "border-red-300 focus:border-red-500" : ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="flex items-center gap-1">
                        State
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="state"
                        value={deliveryInfo.state}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                        placeholder="State"
                        className={!deliveryInfo.state ? "border-red-300 focus:border-red-500" : ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode" className="flex items-center gap-1">
                        Pincode
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        value={deliveryInfo.pincode}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, pincode: e.target.value})}
                        placeholder="Pincode"
                        className={!deliveryInfo.pincode ? "border-red-300 focus:border-red-500" : ""}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                    <Textarea
                      id="deliveryInstructions"
                      value={deliveryInfo.deliveryInstructions}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, deliveryInstructions: e.target.value})}
                      placeholder="Any special delivery instructions..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
                <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className={!paymentMethod ? "border-red-300 focus:border-red-500" : ""}>
                  <SelectValue placeholder="Select payment method *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                  <SelectItem value="upi">UPI Payment</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
              {!paymentMethod && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please select a payment method
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Process Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Order Process</h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Place order (you are here)</li>
                    <li>2. Shopkeeper reviews & approves</li>
                    <li>3. Payment processing</li>
                    <li>4. Order preparation & delivery</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSendOrderRequest} 
              disabled={isCheckingOut}
              className="w-full"
              size="lg"
            >
              {isCheckingOut ? 'Sending Order Request...' : 'Send Order Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}