/**
 * LocationIQ Geocoding Service
 * Uses LocationIQ API for geocoding and reverse geocoding
 */

const LOCATIONIQ_TOKEN = 'pk.2b7ce234f7223596ad2770e384c9434f';
// LocationIQ API base URL - using the correct endpoint
const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  district?: string;
  village?: string;
}

export interface LocationIQResponse {
  lat: string;
  lon: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Geocode an address using LocationIQ
 * Converts address string to coordinates
 */
export async function geocodeAddress(
  address: string,
  retries: number = 3
): Promise<Coordinates | null> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      // LocationIQ uses /search.php endpoint with key parameter
      // Using the correct endpoint format: https://us1.locationiq.com/v1/search.php
      const url = `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_TOKEN}&q=${encodedAddress}&format=json&limit=1&addressdetails=1&normalizecity=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrustKart/1.0', // Some APIs require User-Agent
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // Handle specific error codes
        if (response.status === 401 || response.status === 403) {
          console.error('LocationIQ authentication error:', errorData);
          return null;
        }
        
        if (response.status === 404 || errorData.error === 'Unable to geocode' || errorData.error?.includes('Unable')) {
          // Address not found - this is a valid response, not an error
          console.log('LocationIQ: Address not found for:', address);
          // Return null gracefully - this is expected behavior
          return null;
        }
        
        // Check for authentication errors
        if (errorData.error === 'Invalid key' || errorData.error?.includes('key') || errorData.error?.includes('token')) {
          console.error('LocationIQ: Authentication error - check token:', errorData);
          return null;
        }
        
        // Handle rate limiting or server errors
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        
        console.error(`LocationIQ geocoding error: ${response.status} - ${errorText}`);
        return null;
      }

      let data: LocationIQResponse[];
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('LocationIQ JSON parse error:', parseError);
        return null;
      }
      
      if (data && Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { latitude: lat, longitude: lon };
      } else {
        console.warn('LocationIQ: Invalid coordinates received:', { lat, lon });
      }
      }

      // If we got a response but no valid data
      if (data && Array.isArray(data) && data.length === 0) {
        console.log('LocationIQ: No results found for address:', address);
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
      
      console.error(`LocationIQ geocoding attempt ${attempt} failed:`, error);
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
 * Reverse geocode coordinates using LocationIQ
 * Converts coordinates to address
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  retries: number = 3
): Promise<AddressComponents | null> {
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
      const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_TOKEN}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrustKart/1.0',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // Handle specific error codes
        if (response.status === 401 || response.status === 403) {
          console.error('LocationIQ authentication error:', errorData);
          return null;
        }
        
        if (response.status === 404 || errorData.error === 'Unable to geocode') {
          console.log('LocationIQ: Could not reverse geocode coordinates');
          return null;
        }
        
        // Handle rate limiting or server errors
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        
        console.error(`LocationIQ reverse geocoding error: ${response.status} - ${errorText}`);
        return null;
      }

      let data: LocationIQResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('LocationIQ JSON parse error:', parseError);
        return null;
      }
      
      if (data && data.address) {
        const addr = data.address;
        return {
          address: data.display_name || `${addr.road || ''} ${addr.house_number || ''}`.trim() || undefined,
          city: addr.city || addr.town || addr.village || addr.municipality || undefined,
          district: addr.district || addr.county || undefined,
          state: addr.state || addr.region || undefined,
          country: addr.country || undefined,
          pincode: addr.postcode || undefined,
          village: addr.village || undefined
        };
      }

      // If no address data, return null
      console.log('LocationIQ: No address data in reverse geocode response');
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
      
      console.error(`LocationIQ reverse geocoding attempt ${attempt} failed:`, error);
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
 * Geocode an address with full address components
 * Combines address fields (street, city, state, pincode) and geocodes
 */
export async function geocodeFullAddress(
  addressParts: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }
): Promise<{ coordinates: Coordinates | null; formattedAddress: string }> {
  // Build address string from parts
  // Priority order: street, city, state, pincode, country
  const addressPartsArray: string[] = [];
  
  // Only include non-empty parts
  if (addressParts.street?.trim()) addressPartsArray.push(addressParts.street.trim());
  if (addressParts.city?.trim()) addressPartsArray.push(addressParts.city.trim());
  if (addressParts.state?.trim()) addressPartsArray.push(addressParts.state.trim());
  if (addressParts.pincode?.trim()) addressPartsArray.push(addressParts.pincode.trim());
  
  // Add country if provided, otherwise default to India for better geocoding results
  const country = addressParts.country?.trim() || 'India';
  if (country && country.toLowerCase() !== 'india') {
    addressPartsArray.push(country);
  }
  
  const fullAddress = addressPartsArray.length > 0 
    ? addressPartsArray.join(', ')
    : (addressParts.street || addressParts.city || '');
  
  // If we have at least city or state, try geocoding
  if (!fullAddress || (!addressParts.city && !addressParts.state)) {
    console.warn('LocationIQ: Insufficient address information for geocoding');
    return {
      coordinates: null,
      formattedAddress: fullAddress || ''
    };
  }
  
  const coordinates = await geocodeAddress(fullAddress);
  
  return {
    coordinates,
    formattedAddress: fullAddress
  };
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
 * Batch geocode multiple addresses
 * Processes addresses with rate limiting
 */
export async function batchGeocodeAddresses(
  addresses: string[]
): Promise<Map<string, Coordinates | null>> {
  const results = new Map<string, Coordinates | null>();
  
  // Process in batches to avoid rate limiting
  // LocationIQ free tier: 60 requests per minute
  const batchSize = 2; // Conservative batch size
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (address) => {
        const coords = await geocodeAddress(address);
        results.set(address, coords);
        
        // Small delay to respect rate limits (2 requests per second max)
        await new Promise(resolve => setTimeout(resolve, 500));
      })
    );
    
    // Delay between batches
    if (i + batchSize < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

