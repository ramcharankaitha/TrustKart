'use client';

import { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, reverseGeocode, type Coordinates } from '@/lib/geocoding-service';

export interface LocationData {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  permissionGranted: boolean;
}

/**
 * Automatic location detection hook for customers
 * Automatically detects location on mount if permission is granted
 * Handles all errors gracefully without throwing
 */
export function useAutoLocation(autoDetect: boolean = true) {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    permissionGranted: false,
  });

  // Check stored location from localStorage
  const getStoredLocation = useCallback((): LocationData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('customer_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if stored location is less than 24 hours old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      // Silently fail - invalid stored data
    }
    return null;
  }, []);

  // Store location in localStorage
  const storeLocation = useCallback((location: LocationData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('customer_location', JSON.stringify({
        data: location,
        timestamp: Date.now(),
      }));
    } catch (error) {
      // Silently fail - localStorage might be full or disabled
    }
  }, []);

  // Get current location automatically
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get coordinates using browser geolocation
      const coordinates = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            // Handle different error types gracefully
            let errorMessage = 'Unable to get your location';
            
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = null; // Don't show error for permission denial - it's expected
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location information unavailable';
                break;
              case 3: // TIMEOUT
                errorMessage = 'Location request timed out';
                break;
            }
            
            reject({ code: error.code, message: errorMessage });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // 15 seconds
            maximumAge: 300000, // 5 minutes
          }
        );
      });

      // Try to get address from coordinates (reverse geocoding)
      let addressData: any = null;
      try {
        addressData = await reverseGeocode(coordinates);
      } catch (reverseError) {
        // If reverse geocoding fails, that's okay - we still have coordinates
        console.log('Reverse geocoding failed, but coordinates are available');
      }

      const locationData: LocationData = {
        coordinates,
        address: addressData?.address,
        city: addressData?.city,
        state: addressData?.state,
        country: addressData?.country,
        pincode: addressData?.pincode,
      };

      // Store location
      storeLocation(locationData);

      setState(prev => ({
        ...prev,
        location: locationData,
        isLoading: false,
        error: null,
        permissionGranted: true,
      }));

      return locationData;
    } catch (error: any) {
      // Don't show error for permission denial (code 1) - it's user choice
      const shouldShowError = error.code !== 1;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: shouldShowError ? (error.message || 'Unable to detect location') : null,
        permissionGranted: error.code === 1 ? false : prev.permissionGranted,
      }));

      return null;
    }
  }, [state.isSupported, storeLocation]);

  // Auto-detect location on mount if enabled
  useEffect(() => {
    if (!autoDetect || !state.isSupported) return;

    // First check if we have a stored location
    const stored = getStoredLocation();
    if (stored) {
      setState(prev => ({
        ...prev,
        location: stored,
        permissionGranted: true,
      }));
      return;
    }

    // Try to get current location automatically
    // Use a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      getCurrentLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, [autoDetect, state.isSupported, getStoredLocation, getCurrentLocation]);

  // Update location manually
  const updateLocation = useCallback(async (address: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Geocode the address
      const coordinates = await geocodeAddress(address);
      
      if (!coordinates) {
        throw new Error('Unable to find location for this address');
      }

      const locationData: LocationData = {
        coordinates,
        address,
      };

      // Try reverse geocoding to get full details
      try {
        const addressData = await reverseGeocode(coordinates);
        locationData.city = addressData?.city;
        locationData.state = addressData?.state;
        locationData.country = addressData?.country;
        locationData.pincode = addressData?.pincode;
      } catch (error) {
        // If reverse geocoding fails, that's okay
      }

      // Store location
      storeLocation(locationData);

      setState(prev => ({
        ...prev,
        location: locationData,
        isLoading: false,
        error: null,
      }));

      return locationData;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Unable to update location',
      }));
      return null;
    }
  }, [storeLocation]);

  // Clear location
  const clearLocation = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('customer_location');
      } catch (error) {
        // Silently fail
      }
    }
    
    setState(prev => ({
      ...prev,
      location: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    getCurrentLocation,
    updateLocation,
    clearLocation,
    refreshLocation: getCurrentLocation,
  };
}

