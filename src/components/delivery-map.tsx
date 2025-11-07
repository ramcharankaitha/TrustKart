'use client';

import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  label?: string;
}

interface DeliveryMapProps {
  pickupLocation: Location | null;
  deliveryLocation: Location | null;
  currentLocation?: Location | null;
  className?: string;
}

export function DeliveryMap({ 
  pickupLocation, 
  deliveryLocation, 
  currentLocation,
  className = '' 
}: DeliveryMapProps) {

  // Generate Google Maps URL for navigation
  const getNavigationUrl = (location: Location, destination: 'pickup' | 'delivery') => {
    const { latitude, longitude } = location;
    if (destination === 'pickup' && pickupLocation) {
      return `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.latitude},${pickupLocation.longitude}`;
    } else if (destination === 'delivery' && deliveryLocation) {
      return `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    }
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Generate static map image URL
  const getStaticMapUrl = () => {
    if (!pickupLocation && !deliveryLocation && !currentLocation) return null;

    const markers: string[] = [];
    if (pickupLocation) {
      markers.push(`markers=color:green|label:P|${pickupLocation.latitude},${pickupLocation.longitude}`);
    }
    if (deliveryLocation) {
      markers.push(`markers=color:red|label:D|${deliveryLocation.latitude},${deliveryLocation.longitude}`);
    }
    if (currentLocation) {
      // Use "A" label for delivery agent location
      markers.push(`markers=color:blue|label:A|${currentLocation.latitude},${currentLocation.longitude}`);
    }

    // Use agent location as center if available, otherwise use pickup or delivery location
    const center = currentLocation || pickupLocation || deliveryLocation;
    if (!center) return null;

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=13&size=600x400&${markers.join('&')}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;
  };

  // Alternative: Use OpenStreetMap with Leaflet (no API key required)
  const getOSMMapUrl = () => {
    if (!pickupLocation && !deliveryLocation && !currentLocation) return null;

    // Use agent location as center if available, otherwise use pickup or delivery location
    const center = currentLocation || pickupLocation || deliveryLocation;
    if (!center) return null;

    // Return OpenStreetMap URL - user can click to open in new tab
    return `https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}&zoom=13`;
  };

  if (!pickupLocation && !deliveryLocation && !currentLocation) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-300">Location data not available</p>
      </div>
    );
  }

  const staticMapUrl = getStaticMapUrl();
  const osmMapUrl = getOSMMapUrl();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Preview */}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {staticMapUrl ? (
          <img
            src={staticMapUrl}
            alt="Delivery Route Map"
            className="w-full h-64 object-cover"
            onError={(e) => {
              // Fallback to OpenStreetMap if Google Maps fails
              if (osmMapUrl) {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }}
          />
        ) : (
          <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-slate-400" />
          </div>
        )}
        
        {!staticMapUrl && osmMapUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <Button
              variant="outline"
              onClick={() => window.open(osmMapUrl, '_blank')}
              className="bg-white/90 hover:bg-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Map
            </Button>
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Location */}
        {pickupLocation && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-green-800 dark:text-green-300">Pickup Location</h4>
              </div>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mb-2">
              {pickupLocation.address || `${pickupLocation.latitude.toFixed(6)}, ${pickupLocation.longitude.toFixed(6)}`}
            </p>
            {pickupLocation.label && (
              <p className="text-xs text-green-600 dark:text-green-500">{pickupLocation.label}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => window.open(getNavigationUrl(pickupLocation, 'pickup'), '_blank')}
            >
              <Navigation className="h-3 w-3 mr-2" />
              Navigate to Pickup
            </Button>
          </div>
        )}

        {/* Delivery Location */}
        {deliveryLocation && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                <h4 className="font-semibold text-red-800 dark:text-red-300">Delivery Location</h4>
              </div>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400 mb-2">
              {deliveryLocation.address || `${deliveryLocation.latitude.toFixed(6)}, ${deliveryLocation.longitude.toFixed(6)}`}
            </p>
            {deliveryLocation.label && (
              <p className="text-xs text-red-600 dark:text-red-500">{deliveryLocation.label}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => window.open(getNavigationUrl(deliveryLocation, 'delivery'), '_blank')}
            >
              <Navigation className="h-3 w-3 mr-2" />
              Navigate to Delivery
            </Button>
          </div>
        )}
      </div>

      {/* Current Location / Agent Location (if available) */}
      {currentLocation && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {currentLocation.label || 'Current Location'}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-500">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
          {currentLocation.address && (
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              {currentLocation.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

