'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MapPin, Plus, Edit, Trash2, Star, Home, Briefcase, 
  Building2, Loader2, CheckCircle, XCircle, Database, Copy, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geocodeFullAddress, reverseGeocode } from '@/lib/locationiq-service';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Address {
  id: string;
  customer_id: string;
  label?: string;
  full_name?: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [tableError, setTableError] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- CUSTOMER ADDRESSES SETUP
CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT 'addr_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    label TEXT,
    full_name TEXT,
    phone TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_location ON customer_addresses(latitude, longitude);

CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses
        SET is_default = FALSE
        WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON customer_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();`;

  const [formData, setFormData] = useState({
    label: '',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: '',
    longitude: '',
    isDefault: false,
  });

  // Get customer ID from session
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

  // Fetch addresses
  const fetchAddresses = async () => {
    const customerId = getCustomerId();
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/customer/addresses?customerId=${customerId}`);
      const result = await response.json();

      if (result.success) {
        setAddresses(result.addresses || []);
        setTableError(false);
      } else {
        // Check if error is about table not existing
        if (result.error?.includes('does not exist') || result.error?.includes('schema cache') || result.error?.includes('customer_addresses')) {
          setTableError(true);
          toast({
            variant: 'destructive',
            title: 'Database Table Missing',
            description: 'The customer_addresses table needs to be created. Go to setup page.',
          });
        } else {
          setTableError(false);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to load addresses',
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('does not exist') || errorMessage.includes('schema cache') || errorMessage.includes('customer_addresses')) {
        setTableError(true);
      } else {
        setTableError(false);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load addresses',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      label: '',
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      latitude: '',
      longitude: '',
      isDefault: false,
    });
    setSelectedAddress(null);
  };

  // Open dialog for adding new address
  const handleAddNew = () => {
    resetForm();
    setSelectedAddress(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing address
  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label || '',
      fullName: address.full_name || '',
      phone: address.phone || '',
      addressLine1: address.address_line1,
      addressLine2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country || 'India',
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || '',
      isDefault: address.is_default || false,
    });
    setSelectedAddress(address);
    setIsDialogOpen(true);
  };

  // Geocode address using LocationIQ
  const handleGeocodeAddress = async () => {
    // Require at least city and state, or city/state with pincode
    if (!formData.city || !formData.state) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in at least city and state for geocoding',
      });
      return;
    }

    setGeocoding(true);
    try {
      // Build address string - prioritize: city, state, pincode, street
      // LocationIQ works better with city/state/pincode combinations
      const { coordinates } = await geocodeFullAddress({
        street: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
      });

      if (coordinates) {
        setFormData(prev => ({
          ...prev,
          latitude: coordinates.latitude.toString(),
          longitude: coordinates.longitude.toString(),
        }));

        // Get full address details via reverse geocoding
        const addressData = await reverseGeocode(coordinates);
        if (addressData) {
          // Update fields if they were empty or refine existing ones
          if (!formData.city && addressData.city) {
            setFormData(prev => ({ ...prev, city: addressData.city! }));
          }
          if (!formData.state && addressData.state) {
            setFormData(prev => ({ ...prev, state: addressData.state! }));
          }
          if (!formData.pincode && addressData.pincode) {
            setFormData(prev => ({ ...prev, pincode: addressData.pincode! }));
          }
        }

        toast({
          title: 'Location Found',
          description: 'Address geocoded successfully using LocationIQ',
        });
      } else {
        // Provide helpful guidance for better results
        const suggestion = formData.pincode 
          ? 'Try adding more specific street address details.' 
          : 'Try adding a pincode for better results.';
        
        toast({
          variant: 'default',
          title: 'Location Not Found',
          description: `Could not geocode this address. ${suggestion} You can continue without coordinates - address will still be saved.`,
        });
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      // Don't show error for 404 - it just means address not found
      if (error.message?.includes('404') || error.message?.includes('Unable to geocode')) {
        toast({
          variant: 'default',
          title: 'Address Not Found',
          description: 'This address could not be geocoded. You can continue without coordinates.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Geocoding Error',
          description: 'An error occurred while geocoding. You can continue without coordinates.',
        });
      }
    } finally {
      setGeocoding(false);
    }
  };

  // Save address
  const handleSave = async () => {
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      toast({
        variant: 'destructive',
        title: 'Required Fields Missing',
        description: 'Please fill in address line 1, city, state, and pincode',
      });
      return;
    }

    const customerId = getCustomerId();
    if (!customerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Customer ID not found. Please log in again.',
      });
      return;
    }

    try {
      const url = selectedAddress
        ? `/api/customer/addresses/${selectedAddress.id}`
        : '/api/customer/addresses';

      const method = selectedAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: selectedAddress ? 'Address Updated' : 'Address Added',
          description: 'Address saved successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchAddresses();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save address',
        });
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save address',
      });
    }
  };

  // Delete address
  const handleDelete = async () => {
    if (!selectedAddress) return;

    try {
      const response = await fetch(`/api/customer/addresses/${selectedAddress.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Address Deleted',
          description: 'Address deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setSelectedAddress(null);
        fetchAddresses();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete address',
        });
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete address',
      });
    }
  };

  // Set default address
  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}/default`, {
        method: 'PUT',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Default Address Updated',
          description: 'Default address has been set',
        });
        fetchAddresses();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to set default address',
        });
      }
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to set default address',
      });
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if there's a table error and show setup instructions
  const hasTableError = tableError;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Addresses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your delivery addresses
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2" disabled={hasTableError}>
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {hasTableError && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Database Table Not Found
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                  The customer_addresses table needs to be created before you can manage addresses. 
                  Please run the setup script in your Supabase SQL Editor.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => window.location.href = '/database-setup-addresses'}
                    className="gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Go to Database Setup
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const script = document.createElement('textarea');
                      script.value = sqlScript;
                      document.body.appendChild(script);
                      script.select();
                      document.execCommand('copy');
                      document.body.removeChild(script);
                      toast({
                        title: 'Copied!',
                        description: 'SQL script copied to clipboard. Paste it in Supabase SQL Editor.',
                      });
                    }}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy SQL Script
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !hasTableError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first delivery address to get started
            </p>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getLabelIcon(address.label)}
                    <CardTitle className="text-lg">
                      {address.label || 'Address'}
                    </CardTitle>
                  </div>
                  {address.is_default && (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {address.full_name && (
                  <p className="font-medium text-sm">{address.full_name}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} {address.pincode}
                </p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAddress(address);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription>
              {selectedAddress 
                ? 'Update your delivery address details'
                : 'Add a new delivery address. LocationIQ will automatically geocode your address.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label (Optional)</Label>
                <Select
                  value={formData.label}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (Optional)</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Recipient name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Textarea
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="Street address, building name"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Pincode"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Country"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleGeocodeAddress}
                disabled={geocoding}
                className="gap-2"
              >
                {geocoding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Geocoding...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Get Location (LocationIQ)
                  </>
                )}
              </Button>

              {formData.latitude && formData.longitude && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Location found: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default address
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

