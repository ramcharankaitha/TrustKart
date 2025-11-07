'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  label?: string;
}

interface LiveTrackingMapProps {
  agentLocation: Location | null;
  deliveryLocation: Location | null;
  pickupLocation?: Location | null;
  className?: string;
  onLocationUpdate?: (location: Location) => void;
}

export function LiveTrackingMap({
  agentLocation,
  deliveryLocation,
  pickupLocation,
  className = '',
  onLocationUpdate
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mapKey, setMapKey] = useState<number>(0);

  // Update map URL when agent location changes
  useEffect(() => {
    if (!agentLocation) return;

    setLastUpdate(new Date());
    
    // Create Google Maps Embed URL with live tracking
    // This shows the agent location and allows real-time updates
    const center = agentLocation;
    const zoom = 15;
    
    // Google Maps Embed API URL (interactive map)
    const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${center.latitude},${center.longitude}&zoom=${zoom}`;
    
    // Alternative: Google Maps with directions (shows route)
    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1`;
    
    if (agentLocation && deliveryLocation) {
      googleMapsUrl += `&origin=${agentLocation.latitude},${agentLocation.longitude}`;
      googleMapsUrl += `&destination=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
      googleMapsUrl += `&travelmode=driving`;
    } else {
      googleMapsUrl = `https://www.google.com/maps?q=${center.latitude},${center.longitude}`;
    }

    // Create static map with markers that updates
    const markers: string[] = [];
    
    if (pickupLocation) {
      markers.push(`markers=color:green|label:P|${pickupLocation.latitude},${pickupLocation.longitude}`);
    }
    
    if (deliveryLocation) {
      markers.push(`markers=color:red|label:D|${deliveryLocation.latitude},${deliveryLocation.longitude}`);
    }
    
    // Agent location with vehicle icon
    markers.push(`markers=color:blue|label:🚗|${agentLocation.latitude},${agentLocation.longitude}`);
    
    // Create path from agent to delivery location
    let path = '';
    if (agentLocation && deliveryLocation) {
      path = `&path=color:0x0000ff|weight:5|${agentLocation.latitude},${agentLocation.longitude}|${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    }

    // Add timestamp to force map refresh (bypasses cache)
    const timestamp = Date.now();
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=800x500&${markers.join('&')}${path}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;
    
    setMapUrl(staticMapUrl);
    setMapKey(timestamp); // Force re-render with new key

    // Call update callback
    if (onLocationUpdate) {
      onLocationUpdate(agentLocation);
    }
  }, [agentLocation, deliveryLocation, pickupLocation, onLocationUpdate]);

  // Calculate distance between agent and delivery location
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = agentLocation && deliveryLocation 
    ? calculateDistance(agentLocation, deliveryLocation).toFixed(2)
    : null;

  if (!agentLocation) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-300">Waiting for agent location...</p>
      </div>
    );
  }

  const openGoogleMaps = () => {
    if (agentLocation && deliveryLocation) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${agentLocation.latitude},${agentLocation.longitude}&destination=${deliveryLocation.latitude},${deliveryLocation.longitude}&travelmode=driving`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps?q=${agentLocation.latitude},${agentLocation.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live Map Display */}
      <div className="relative rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg">
        {/* Map Image - Updates automatically */}
        {mapUrl ? (
          <div className="relative">
            <img
              src={`${mapUrl}&timestamp=${mapKey}`}
              alt="Live Delivery Tracking"
              className="w-full h-96 object-cover"
              key={mapKey}
              onError={(e) => {
                console.error('Map image failed to load');
              }}
            />
            
            {/* Live indicator overlay */}
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">LIVE</span>
            </div>

            {/* Agent Vehicle Marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-600 text-white rounded-full p-2 shadow-xl border-2 border-white animate-pulse">
                <Truck className="h-6 w-6" />
              </div>
            </div>

            {/* Distance indicator */}
            {distance && (
              <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  📍 {distance} km away
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Estimated arrival: {Math.round(parseFloat(distance) * 3)} min
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-slate-400" />
          </div>
        )}

        {/* Full Screen Map Button */}
        <div className="absolute bottom-4 left-4">
          <Button
            onClick={openGoogleMaps}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Open Full Map
          </Button>
        </div>
      </div>

      {/* Location Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent Location */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">Delivery Agent</h4>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
            {agentLocation.latitude.toFixed(6)}, {agentLocation.longitude.toFixed(6)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Pickup Location */}
        {pickupLocation && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800 dark:text-green-300">Pickup</h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              {pickupLocation.address || `${pickupLocation.latitude.toFixed(6)}, ${pickupLocation.longitude.toFixed(6)}`}
            </p>
          </div>
        )}

        {/* Delivery Location */}
        {deliveryLocation && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-800 dark:text-red-300">Your Location</h4>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400">
              {deliveryLocation.address || `${deliveryLocation.latitude.toFixed(6)}, ${deliveryLocation.longitude.toFixed(6)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

