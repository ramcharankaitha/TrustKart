'use client';
import type { ReactNode } from "react";
import { CartProvider, useCart } from "@/context/cart-context";
import { NotificationProvider } from "@/context/notification-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { UserNav } from "@/components/user-nav";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Menu, Search, ShoppingCart, Leaf, Bell, Settings, 
  Sparkles, MapPin, Filter, SortAsc, Loader2, Navigation, Truck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { User } from "@/lib/types";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/cart-sheet";
import CustomerDashboard from "@/components/customer-dashboard";
import ShopkeeperStatusCard from "@/components/shopkeeper-status-card";
import { useAutoLocation } from "@/hooks/use-auto-location";
import { reverseGeocode, geocodeAddress } from "@/lib/locationiq-service";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/chatbot";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CustomerHeader = () => {
  const { cart } = useCart();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const location = useAutoLocation(false); // Don't auto-detect, let user click button
  const { toast } = useToast();
  const [locationText, setLocationText] = useState<string>("Set Location");
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [geocodingAddress, setGeocodingAddress] = useState<boolean>(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('customer_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.data) {
          const addr = parsed.data;
          if (addr.city) {
            setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
          } else if (addr.address) {
            setLocationText(addr.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Update location text when location changes
  useEffect(() => {
    if (location.location) {
      const addr = location.location;
      if (addr.city) {
        setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
      } else if (addr.address) {
        setLocationText(addr.address.substring(0, 20) + '...');
      } else {
        setLocationText("Location Set");
      }
    }
  }, [location.location]);

  const handleGetLocation = async () => {
    if (!location.isSupported) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
      });
      return;
    }

    const locationData = await location.getCurrentLocation();
    
    if (locationData && locationData.coordinates) {
      // Use LocationIQ for reverse geocoding to get better address with the provided token
      try {
        const addressData = await reverseGeocode(locationData.coordinates);
        if (addressData) {
          const updatedLocation = {
            ...locationData,
            address: addressData.address || locationData.address,
            city: addressData.city || locationData.city,
            state: addressData.state || locationData.state,
            pincode: addressData.pincode || locationData.pincode,
          };
          
          // Update localStorage
          localStorage.setItem('customer_location', JSON.stringify({
            data: updatedLocation,
            timestamp: Date.now(),
          }));

          // Update display
          if (addressData.city) {
            setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
          } else if (addressData.address) {
            setLocationText(addressData.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }

          toast({
            title: "Location Updated via LocationIQ",
            description: `Location set to ${addressData.city || addressData.address || 'your location'}`,
          });
        }
      } catch (error) {
        console.error('LocationIQ reverse geocoding error:', error);
        toast({
          title: "Location Set",
          description: "Your location has been saved using browser coordinates.",
        });
      }
    } else if (location.error) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: location.error || "Could not get your location.",
      });
    }
  };

  const handleManualAddressGeocode = async () => {
    if (!manualAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter an address to search.",
      });
      return;
    }

    setGeocodingAddress(true);
    
    try {
      // Use LocationIQ to geocode the address using the provided token
      const coordinates = await geocodeAddress(manualAddress.trim());
      
      if (coordinates) {
        // Now reverse geocode to get full address details
        const addressData = await reverseGeocode(coordinates);
        
        const locationData = {
          coordinates,
          address: addressData?.address || manualAddress,
          city: addressData?.city,
          state: addressData?.state,
          country: addressData?.country || 'India',
          pincode: addressData?.pincode,
        };

        // Update localStorage
        localStorage.setItem('customer_location', JSON.stringify({
          data: locationData,
          timestamp: Date.now(),
        }));

        // Update display
        if (addressData?.city) {
          setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
        } else if (addressData?.address) {
          setLocationText(addressData.address.substring(0, 20) + '...');
        } else {
          setLocationText(manualAddress.substring(0, 20) + '...');
        }

        // Location saved to localStorage - the hook will pick it up
        // Force UI update by checking localStorage again
        const stored = localStorage.getItem('customer_location');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.data) {
              // Trigger a state update by calling location's updateLocation if available
              // For now, just rely on localStorage being updated
            }
          } catch (e) {
            // Ignore
          }
        }

        toast({
          title: "Location Set via LocationIQ",
          description: `Location set to ${addressData?.city || addressData?.address || manualAddress}`,
        });

        setManualAddress("");
        setShowManualInput(false);
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find coordinates for this address. Please try a more specific address.",
        });
      }
    } catch (error: any) {
      console.error('LocationIQ geocoding error:', error);
      toast({
        variant: "destructive",
        title: "Geocoding Error",
        description: error.message || "Could not geocode address. Please try again.",
      });
    } finally {
      setGeocodingAddress(false);
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="container-professional">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-headline">
              TrustKart
            </span>
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search for fresh products, shops..."
                className="pl-12 pr-4 py-3 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <SortAsc className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Location Button - Middle */}
          <div className="mx-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-12 px-4 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
                  disabled={location.isLoading}
                >
                  {location.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Getting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
                        {locationText}
                      </span>
                      <span className="sm:hidden">Location</span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Your Location</h3>
                    <span className="ml-auto text-xs text-slate-500">via LocationIQ</span>
                  </div>
                  
                  {location.location ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {location.location.city && (
                          <p className="text-sm">
                            <span className="font-medium">City:</span> {location.location.city}
                          </p>
                        )}
                        {location.location.state && (
                          <p className="text-sm">
                            <span className="font-medium">State:</span> {location.location.state}
                          </p>
                        )}
                        {location.location.pincode && (
                          <p className="text-sm">
                            <span className="font-medium">Pincode:</span> {location.location.pincode}
                          </p>
                        )}
                        {location.location.address && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {location.location.address}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleGetLocation}
                          disabled={location.isLoading || geocodingAddress}
                        >
                          {location.isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-2" />
                              Update GPS
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setShowManualInput(!showManualInput)}
                        >
                          {showManualInput ? "Cancel" : "Enter Address"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {!showManualInput ? (
                          <>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Use your current GPS location or enter an address manually
                            </p>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full"
                              onClick={handleGetLocation}
                              disabled={location.isLoading || geocodingAddress || !location.isSupported}
                            >
                              {location.isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Getting Location...
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Use Current Location
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setShowManualInput(true)}
                            >
                              Enter Address Manually
                            </Button>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="Enter address, city, pincode..."
                              value={manualAddress}
                              onChange={(e) => setManualAddress(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleManualAddressGeocode();
                                }
                              }}
                              className="h-9"
                            />
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full"
                              onClick={handleManualAddressGeocode}
                              disabled={geocodingAddress || !manualAddress.trim()}
                            >
                              {geocodingAddress ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Searching LocationIQ...
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Search Location
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setShowManualInput(false);
                                setManualAddress("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {showManualInput && location.location && (
                    <div className="pt-2 border-t space-y-2">
                      <Input
                        placeholder="Enter address, city, pincode..."
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleManualAddressGeocode();
                          }
                        }}
                        className="h-9"
                      />
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={handleManualAddressGeocode}
                        disabled={geocodingAddress || !manualAddress.trim()}
                      >
                        {geocodingAddress ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching LocationIQ...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Search & Update Location
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationDropdown />
            
            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader className="sr-only">
                  <SheetTitle>Shopping Cart</SheetTitle>
                </SheetHeader>
                <CartSheet />
              </SheetContent>
            </Sheet>
            
            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
};

const ShopkeeperHeader = () => {
  const { cart } = useCart();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const location = useAutoLocation(false); // Don't auto-detect, let user click button
  const { toast } = useToast();
  const [locationText, setLocationText] = useState<string>("Set Location");
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [geocodingAddress, setGeocodingAddress] = useState<boolean>(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('shopkeeper_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.data) {
          const addr = parsed.data;
          if (addr.city) {
            setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
          } else if (addr.address) {
            setLocationText(addr.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Update location text when location changes
  useEffect(() => {
    if (location.location) {
      const addr = location.location;
      if (addr.city) {
        setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
      } else if (addr.address) {
        setLocationText(addr.address.substring(0, 20) + '...');
      } else {
        setLocationText("Location Set");
      }
    }
  }, [location.location]);

  const handleGetLocation = async () => {
    if (!location.isSupported) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
      });
      return;
    }

    const locationData = await location.getCurrentLocation();
    
    if (locationData && locationData.coordinates) {
      // Use LocationIQ for reverse geocoding to get better address with the provided token
      try {
        const addressData = await reverseGeocode(locationData.coordinates);
        if (addressData) {
          const updatedLocation = {
            ...locationData,
            address: addressData.address || locationData.address,
            city: addressData.city || locationData.city,
            state: addressData.state || locationData.state,
            pincode: addressData.pincode || locationData.pincode,
          };
          
          // Update localStorage
          localStorage.setItem('shopkeeper_location', JSON.stringify({
            data: updatedLocation,
            timestamp: Date.now(),
          }));

          // Update display
          if (addressData.city) {
            setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
          } else if (addressData.address) {
            setLocationText(addressData.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }

          // Save to database
          try {
            const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
            if (userSession.id) {
              await fetch('/api/user/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: userSession.id,
                  latitude: locationData.coordinates.latitude,
                  longitude: locationData.coordinates.longitude,
                }),
              });
            }
          } catch (error) {
            console.log('Location save to database failed (non-critical):', error);
          }

          toast({
            title: "Location Updated via LocationIQ",
            description: `Location set to ${addressData.city || addressData.address || 'your location'}`,
          });
        }
      } catch (error) {
        console.error('LocationIQ reverse geocoding error:', error);
        toast({
          title: "Location Set",
          description: "Your location has been saved using browser coordinates.",
        });
      }
    } else if (location.error) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: location.error || "Could not get your location.",
      });
    }
  };

  const handleManualAddressGeocode = async () => {
    if (!manualAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter an address to search.",
      });
      return;
    }

    setGeocodingAddress(true);
    try {
      const coordinates = await geocodeAddress(manualAddress.trim());
      
      if (coordinates) {
        const addressData = await reverseGeocode(coordinates);
        if (addressData) {
          const locationData = {
            coordinates,
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode,
            country: addressData.country || 'India',
          };
          
          // Update localStorage
          localStorage.setItem('shopkeeper_location', JSON.stringify({
            data: locationData,
            timestamp: Date.now(),
          }));

          // Update display
          if (addressData.city) {
            setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
          } else if (addressData.address) {
            setLocationText(addressData.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }

          // Save to database
          try {
            const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
            if (userSession.id) {
              await fetch('/api/user/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: userSession.id,
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                }),
              });
            }
          } catch (error) {
            console.log('Location save to database failed (non-critical):', error);
          }

          setShowManualInput(false);
          setManualAddress('');

          toast({
            title: "Location Found via LocationIQ",
            description: `Location set to ${addressData.city || addressData.address || manualAddress}`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find the address. Please try a more specific address.",
        });
      }
    } catch (error) {
      console.error('LocationIQ geocoding error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not geocode address. Please try again.",
      });
    } finally {
      setGeocodingAddress(false);
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="container-professional">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-headline">
              TrustKart
            </span>
          </Link>
          
          {/* Shop Status & Location */}
          <div className="flex-1 max-w-md mx-8 flex items-center gap-4">
            <div className="flex-1">
              <ShopkeeperStatusCard shopkeeperId="current-user-id" />
            </div>
            
            {/* Location Button */}
            <div className="mx-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 px-4 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
                    disabled={location.isLoading}
                  >
                    {location.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Getting...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
                          {locationText}
                        </span>
                        <span className="sm:hidden">Location</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">Your Location</h3>
                      <span className="ml-auto text-xs text-slate-500">via LocationIQ</span>
                    </div>
                    
                    {location.location ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {location.location.city && (
                            <p className="text-sm">
                              <span className="font-medium">City:</span> {location.location.city}
                            </p>
                          )}
                          {location.location.state && (
                            <p className="text-sm">
                              <span className="font-medium">State:</span> {location.location.state}
                            </p>
                          )}
                          {location.location.pincode && (
                            <p className="text-sm">
                              <span className="font-medium">Pincode:</span> {location.location.pincode}
                            </p>
                          )}
                          {location.location.address && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {location.location.address}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleGetLocation}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={location.isLoading}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Update Location
                          </Button>
                          <Button
                            onClick={() => setShowManualInput(!showManualInput)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {showManualInput ? 'Cancel' : 'Manual'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={handleGetLocation}
                          className="w-full"
                          disabled={location.isLoading}
                        >
                          {location.isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Get Current Location
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowManualInput(!showManualInput)}
                          variant="outline"
                          className="w-full"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Enter Address Manually
                        </Button>
                      </div>
                    )}

                    {showManualInput && (
                      <div className="space-y-2 pt-2 border-t">
                        <Input
                          placeholder="Enter your address..."
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !geocodingAddress) {
                              handleManualAddressGeocode();
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          onClick={handleManualAddressGeocode}
                          size="sm"
                          className="w-full"
                          disabled={geocodingAddress || !manualAddress.trim()}
                        >
                          {geocodingAddress ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-2" />
                              Search LocationIQ
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                5
              </Badge>
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
            
            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
};

const DeliveryAgentHeader = () => {
  const location = useAutoLocation(false); // Don't auto-detect, let user click button
  const { toast } = useToast();
  const [locationText, setLocationText] = useState<string>("Set Location");
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [geocodingAddress, setGeocodingAddress] = useState<boolean>(false);
  const [deliveryAgent, setDeliveryAgent] = useState<any>(null);

  // Load delivery agent session
  useEffect(() => {
    try {
      const sessionData = sessionStorage.getItem('deliveryAgentSession');
      if (sessionData) {
        const agent = JSON.parse(sessionData);
        setDeliveryAgent(agent);
      }
    } catch (error) {
      console.error('Error loading delivery agent session:', error);
    }
  }, []);

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('delivery_agent_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.data) {
          const addr = parsed.data;
          if (addr.city) {
            setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
          } else if (addr.address) {
            setLocationText(addr.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Update location text when location changes
  useEffect(() => {
    if (location.location) {
      const addr = location.location;
      if (addr.city) {
        setLocationText(`${addr.city}${addr.state ? ', ' + addr.state : ''}`);
      } else if (addr.address) {
        setLocationText(addr.address.substring(0, 20) + '...');
      } else {
        setLocationText("Location Set");
      }
    }
  }, [location.location]);

  const handleGetLocation = async () => {
    if (!location.isSupported) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
      });
      return;
    }

    const locationData = await location.getCurrentLocation();
    
    if (locationData && locationData.coordinates) {
      // Use LocationIQ for reverse geocoding to get better address with the provided token
      try {
        const addressData = await reverseGeocode(locationData.coordinates);
        if (addressData) {
          const updatedLocation = {
            ...locationData,
            address: addressData.address || locationData.address,
            city: addressData.city || locationData.city,
            state: addressData.state || locationData.state,
            pincode: addressData.pincode || locationData.pincode,
          };
          
          // Update localStorage
          localStorage.setItem('delivery_agent_location', JSON.stringify({
            data: updatedLocation,
            timestamp: Date.now(),
          }));

          // Update display
          if (addressData.city) {
            setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
          } else if (addressData.address) {
            setLocationText(addressData.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }

          // Save to database if delivery agent ID is available
          try {
            if (deliveryAgent?.id) {
              await fetch('/api/delivery-agents/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deliveryAgentId: deliveryAgent.id,
                  latitude: locationData.coordinates.latitude,
                  longitude: locationData.coordinates.longitude,
                }),
              });
            }
          } catch (error) {
            console.log('Location save to database failed (non-critical):', error);
          }

          toast({
            title: "Location Updated via LocationIQ",
            description: `Location set to ${addressData.city || addressData.address || 'your location'}`,
          });
        }
      } catch (error) {
        console.error('LocationIQ reverse geocoding error:', error);
        toast({
          title: "Location Set",
          description: "Your location has been saved using browser coordinates.",
        });
      }
    } else if (location.error) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: location.error || "Could not get your location.",
      });
    }
  };

  const handleManualAddressGeocode = async () => {
    if (!manualAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter an address to search.",
      });
      return;
    }

    setGeocodingAddress(true);
    try {
      const coordinates = await geocodeAddress(manualAddress.trim());
      
      if (coordinates) {
        const addressData = await reverseGeocode(coordinates);
        if (addressData) {
          const locationData = {
            coordinates,
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode,
            country: addressData.country || 'India',
          };
          
          // Update localStorage
          localStorage.setItem('delivery_agent_location', JSON.stringify({
            data: locationData,
            timestamp: Date.now(),
          }));

          // Update display
          if (addressData.city) {
            setLocationText(`${addressData.city}${addressData.state ? ', ' + addressData.state : ''}`);
          } else if (addressData.address) {
            setLocationText(addressData.address.substring(0, 20) + '...');
          } else {
            setLocationText("Location Set");
          }

          // Save to database
          try {
            if (deliveryAgent?.id) {
              await fetch('/api/delivery-agents/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deliveryAgentId: deliveryAgent.id,
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                }),
              });
            }
          } catch (error) {
            console.log('Location save to database failed (non-critical):', error);
          }

          setShowManualInput(false);
          setManualAddress('');

          toast({
            title: "Location Found via LocationIQ",
            description: `Location set to ${addressData.city || addressData.address || manualAddress}`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find the address. Please try a more specific address.",
        });
      }
    } catch (error) {
      console.error('LocationIQ geocoding error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not geocode address. Please try again.",
      });
    } finally {
      setGeocodingAddress(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="container-professional">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors group">
            <div className="relative">
              <Truck className="h-8 w-8 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-headline">
              TrustKart Delivery
            </span>
          </Link>
          
          {/* Availability Status & Location */}
          <div className="flex-1 max-w-md mx-8 flex items-center gap-4">
            {/* Availability Badge */}
            <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${deliveryAgent?.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {deliveryAgent?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
            
            {/* Location Button */}
            <div className="mx-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 px-4 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-200"
                    disabled={location.isLoading}
                  >
                    {location.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Getting...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                        <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
                          {locationText}
                        </span>
                        <span className="sm:hidden">Location</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-sm">Your Location</h3>
                      <span className="ml-auto text-xs text-slate-500">via LocationIQ</span>
                    </div>
                    
                    {location.location ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {location.location.city && (
                            <p className="text-sm">
                              <span className="font-medium">City:</span> {location.location.city}
                            </p>
                          )}
                          {location.location.state && (
                            <p className="text-sm">
                              <span className="font-medium">State:</span> {location.location.state}
                            </p>
                          )}
                          {location.location.pincode && (
                            <p className="text-sm">
                              <span className="font-medium">Pincode:</span> {location.location.pincode}
                            </p>
                          )}
                          {location.location.address && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {location.location.address}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleGetLocation}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={location.isLoading}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Update Location
                          </Button>
                          <Button
                            onClick={() => setShowManualInput(!showManualInput)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {showManualInput ? 'Cancel' : 'Manual'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={handleGetLocation}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={location.isLoading}
                        >
                          {location.isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Get Current Location
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowManualInput(!showManualInput)}
                          variant="outline"
                          className="w-full"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Enter Address Manually
                        </Button>
                      </div>
                    )}

                    {showManualInput && (
                      <div className="space-y-2 pt-2 border-t">
                        <Input
                          placeholder="Enter your address..."
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !geocodingAddress) {
                              handleManualAddressGeocode();
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          onClick={handleManualAddressGeocode}
                          size="sm"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={geocodingAddress || !manualAddress.trim()}
                        >
                          {geocodingAddress ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-2" />
                              Search LocationIQ
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                0
              </Badge>
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
            
            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="container-professional">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-headline">
              TrustKart Admin
            </span>
          </Link>
          
          {/* Admin Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">12</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">156</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Shops</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">2.4K</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Users</div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                8
              </Badge>
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
            
            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<User['role'] | 'guest'>('guest');
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const handleStorageChange = () => {
      // Check localStorage first (for backward compatibility)
      const localRole = localStorage.getItem('userRole') as User['role'] | null;
      
      // Check sessionStorage for Supabase authentication
      const sessionData = sessionStorage.getItem('userSession');
      const deliveryAgentSession = sessionStorage.getItem('deliveryAgentSession');
      let sessionRole: User['role'] | null = null;
      let hasValidSession = false;
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          sessionRole = session.role as User['role'];
          hasValidSession = !!(session.id && session.email);
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      } else if (deliveryAgentSession) {
        try {
          const session = JSON.parse(deliveryAgentSession);
          sessionRole = 'delivery_agent' as User['role'];
          hasValidSession = !!(session.id && session.email);
        } catch (error) {
          console.error('Error parsing delivery agent session data:', error);
        }
      }
      
      // Use session role if available, otherwise fall back to localStorage
      const rawRole = (sessionRole || localRole || 'guest') as string;
      const normalizedRole = (rawRole || 'guest').toString().toLowerCase() as User['role'] | 'guest';
      
      setUserRole(normalizedRole);
      setIsAuthenticated(hasValidSession || !!localRole);
      
      // If no valid session and trying to access protected routes, redirect to login
      if (!hasValidSession && !localRole && pathname !== '/dashboard') {
        console.log('No valid session found, redirecting to login');
        router.push('/login');
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname, router]);

  if (!isClient || (!isAuthenticated && pathname !== '/dashboard')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
            {!isClient ? 'Loading TrustKart...' : 'Checking authentication...'}
          </div>
        </div>
      </div>
    );
  }

  // Determine header component based on user role
  const getHeaderComponent = () => {
    if (userRole === 'customer' || userRole === 'guest') {
      return <CustomerHeader />;
    } else if (userRole === 'shopkeeper') {
      return <ShopkeeperHeader />;
    } else if (userRole === 'admin') {
      return <AdminHeader />;
    } else if (userRole === 'delivery_agent') {
      return <DeliveryAgentHeader />;
    }
    return <CustomerHeader />;
  };

  // For customers/guests, show the customer dashboard with full layout
  if (userRole === 'customer' || userRole === 'guest') {
    return (
      <NotificationProvider>
        <CartProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {getHeaderComponent()}
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            {/* AI Chatbot - Available for all customers */}
            <Chatbot userRole={userRole === 'customer' ? 'customer' : 'guest'} />
          </div>
        </CartProvider>
      </NotificationProvider>
    );
  }

  // For shopkeepers, admins, and delivery agents, show the sidebar layout
  return (
    <NotificationProvider>
      <CartProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {getHeaderComponent()}
          
          <div className="flex">
            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <DashboardSidebar 
                  userRole={userRole} 
                  onNavigate={() => setSidebarOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <DashboardSidebar userRole={userRole} />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-h-screen w-full overflow-x-hidden">
              <div className="container-professional py-4 sm:py-6 md:py-8">
                {children}
              </div>
            </main>
          </div>
          
          <Footer />
          {/* AI Chatbot - Available for shopkeepers and admins */}
          <Chatbot userRole={userRole === 'shopkeeper' ? 'shopkeeper' : userRole === 'admin' ? 'admin' : 'guest'} />
        </div>
      </CartProvider>
    </NotificationProvider>
  );
}