/**
 * Geocoding Service
 * Converts addresses to coordinates and vice versa
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

/**
 * Convert address string to coordinates using Nominatim (OpenStreetMap)
 * Free and doesn't require API key
 * Includes retry logic and comprehensive error handling
 */
export async function geocodeAddress(address: string, retries: number = 3): Promise<Coordinates | null> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    console.warn('⚠️ Geocoding: Empty or invalid address');
    return null;
  }

  // Clean and format address for better geocoding results
  let formattedAddress = address.trim();
  
  // Remove duplicate phrases (common in addresses like "Kalasalingam University, Kalasalingam University")
  const parts = formattedAddress.split(',').map(p => p.trim()).filter(p => p.length > 0);
  const uniqueParts: string[] = [];
  const seen = new Set<string>();
  
  for (const part of parts) {
    const normalizedPart = part.toLowerCase();
    if (!seen.has(normalizedPart)) {
      seen.add(normalizedPart);
      uniqueParts.push(part);
    }
  }
  
  formattedAddress = uniqueParts.join(', ');
  
  // For Indian addresses, add "India" if not present to improve geocoding accuracy
  if (!formattedAddress.toLowerCase().includes('india') && 
      !formattedAddress.toLowerCase().includes('भारत')) {
    formattedAddress = `${formattedAddress}, India`;
  }

  console.log('📍 Geocoding address:', {
    original: address,
    formatted: formattedAddress
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use Nominatim API (free, no API key required)
      // Add country code for better results
      const encodedAddress = encodeURIComponent(formattedAddress);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in&addressdetails=1`;
      
      console.log(`📍 Geocoding attempt ${attempt}/${retries}:`, url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DeliveryApp/1.0', // Required by Nominatim
          'Accept': 'application/json',
          'Referer': typeof window !== 'undefined' ? window.location.origin : 'https://deliveryapp.com'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Geocoding HTTP error (attempt ${attempt}):`, response.status, response.statusText);
        // If rate limited or server error, wait before retry
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            const waitTime = 2000 * attempt;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime)); // Exponential backoff
            continue;
          }
        }
        return null;
      }

      const data = await response.json();
      console.log(`📍 Geocoding response (attempt ${attempt}):`, {
        hasData: !!data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        firstResult: Array.isArray(data) && data.length > 0 ? {
          lat: data[0].lat,
          lon: data[0].lon,
          display_name: data[0].display_name?.substring(0, 50)
        } : null
      });
      
      if (data && Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Validate coordinates
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          console.log('✅ Geocoding successful:', { latitude: lat, longitude: lon });
          return { latitude: lat, longitude: lon };
        } else {
          console.warn('⚠️ Invalid coordinates from geocoding:', { lat, lon });
        }
      } else {
        console.warn('⚠️ No valid results from geocoding service');
      }

      // If no results and this is not the last attempt, try without "India" suffix
      if (attempt < retries && formattedAddress.endsWith(', India')) {
        formattedAddress = address.trim();
        console.log('🔄 Retrying with original address without country suffix...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return null;
    } catch (error: any) {
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      // Other errors - return null
      if (attempt === retries) {
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return null;
}

/**
 * Convert coordinates to address (reverse geocoding)
 * Includes retry logic and comprehensive error handling
 */
export async function reverseGeocode(coordinates: Coordinates, retries: number = 3): Promise<AddressComponents | null> {
  if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
    return null;
  }

  const { latitude, longitude } = coordinates;
  
  // Validate coordinates
  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DeliveryApp/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If rate limited or server error, wait before retry
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
            continue;
          }
        }
        return null;
      }

      const data = await response.json();
      
      if (data && data.address) {
        return {
          address: data.display_name || `${data.address.road || ''} ${data.address.house_number || ''}`.trim() || undefined,
          city: data.address.city || data.address.town || data.address.village || undefined,
          state: data.address.state || undefined,
          country: data.address.country || undefined,
          pincode: data.address.postcode || undefined
        };
      }

      return null;
    } catch (error: any) {
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      // Other errors - return null
      if (attempt === retries) {
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format address string with fallback coordinates
 */
export function formatAddressWithCoords(
  address: string,
  coordinates?: Coordinates | null
): string {
  if (!coordinates) {
    return address;
  }
  return `${address} (${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)})`;
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocodeAddresses(
  addresses: string[]
): Promise<Map<string, Coordinates | null>> {
  const results = new Map<string, Coordinates | null>();
  
  // Process in batches to avoid rate limiting
  const batchSize = 3; // Nominatim allows 1 request per second
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (address) => {
        const coords = await geocodeAddress(address);
        results.set(address, coords);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      })
    );
  }
  
  return results;
}

