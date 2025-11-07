# Delivery Location Mapping System

## Overview
This system automatically maps shopkeeper and customer addresses to delivery agents when orders are accepted. It provides accurate location tracking and navigation for delivery agents.

## Features

### 1. Automatic Location Mapping
- When a shopkeeper accepts an order, the system automatically:
  - Geocodes shopkeeper address (pickup location)
  - Geocodes customer delivery address
  - Creates a delivery request with location coordinates
  - Maps locations to delivery agents

### 2. Location Tracking
- Stores latitude/longitude coordinates for:
  - Shop locations (pickup points)
  - Customer delivery addresses
  - Order locations
  - Delivery assignments

### 3. Delivery Agent Dashboard
- Interactive map showing:
  - Pickup location (green marker)
  - Delivery location (red marker)
  - Navigation buttons to open Google Maps
  - Distance and route information

## Database Setup

### Step 1: Run the SQL Script
Execute the `ADD-LOCATION-FIELDS.sql` file in your Supabase SQL editor:

```sql
-- This adds location columns to:
-- - orders table (customer_latitude, customer_longitude, shop_latitude, shop_longitude)
-- - deliveries table (pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, pickup_address)
-- - shops table (latitude, longitude)
-- - users table (latitude, longitude)
```

### Step 2: Verify Tables
Check that the columns were added successfully:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'deliveries', 'shops', 'users')
AND column_name LIKE '%latitude%' OR column_name LIKE '%longitude%';
```

## How It Works

### Order Acceptance Flow

1. **Shopkeeper Approves Order**
   - Shopkeeper clicks "Approve" in the orders dashboard
   - System updates order status to "APPROVED"
   - Automatic delivery request is created

2. **Location Geocoding**
   - System geocodes shopkeeper address (pickup location)
   - System geocodes customer address (delivery location)
   - Coordinates are stored in database

3. **Delivery Creation**
   - Delivery record created with:
     - Pickup location (shopkeeper address with coordinates)
     - Delivery location (customer address with coordinates)
     - Status: "ASSIGNED"
     - Notes with address information

4. **Delivery Agent Access**
   - Delivery agent sees delivery in dashboard
   - Map shows both locations
   - Navigation buttons for Google Maps integration

## API Endpoints

### POST `/api/orders/accept`
Creates delivery request with location mapping when order is accepted.

**Request:**
```json
{
  "orderId": "order_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery request created with location mapping",
  "delivery": { ... },
  "pickupLocation": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "deliveryLocation": {
    "latitude": 19.2183,
    "longitude": 72.9781
  }
}
```

### GET `/api/deliveries`
Returns deliveries with location data.

**Query Parameters:**
- `deliveryAgentId` - Filter by delivery agent
- `status` - Filter by delivery status

**Response includes:**
- `pickup_latitude`, `pickup_longitude`
- `delivery_latitude`, `delivery_longitude`
- `pickup_address`
- Order details with shop and customer locations

## Components

### DeliveryMap Component
Located in `src/components/delivery-map.tsx`

**Props:**
```typescript
{
  pickupLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    label?: string;
  } | null;
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    label?: string;
  } | null;
  currentLocation?: Location | null;
  className?: string;
}
```

**Features:**
- Static map preview (Google Maps or OpenStreetMap)
- Navigation buttons (opens Google Maps)
- Location cards with addresses
- Color-coded markers (green=pickup, red=delivery)

### Geocoding Service
Located in `src/lib/geocoding-service.ts`

**Functions:**
- `geocodeAddress(address: string)` - Convert address to coordinates
- `reverseGeocode(coordinates)` - Convert coordinates to address
- `calculateDistance(coord1, coord2)` - Calculate distance between points
- `batchGeocodeAddresses(addresses[])` - Batch geocode multiple addresses

**Usage:**
```typescript
import { geocodeAddress } from '@/lib/geocoding-service';

const coords = await geocodeAddress('123 Main St, Mumbai, India');
// Returns: { latitude: 19.0760, longitude: 72.8777 }
```

## Delivery Agent Workflow

1. **View Deliveries**
   - Log in to delivery agent dashboard
   - See all assigned deliveries with status

2. **View Map**
   - Each delivery card shows:
     - Map with pickup and delivery locations
     - Pickup address (shopkeeper location)
     - Delivery address (customer location)
     - Navigation buttons

3. **Navigate**
   - Click "Navigate to Pickup" → Opens Google Maps to shop location
   - After picking up, click "Navigate to Delivery" → Opens Google Maps to customer location

4. **Update Status**
   - Mark as "Picked Up" when at shop
   - Mark as "In Transit" when on the way
   - Mark as "Delivered" when complete

## Location Data Sources

### Priority Order:
1. **Stored Coordinates** - If shop/customer already has coordinates in database
2. **Geocoded Address** - System geocodes address using Nominatim (OpenStreetMap)
3. **Fallback** - If geocoding fails, address is stored without coordinates

### Geocoding Service
- Uses **Nominatim (OpenStreetMap)** - Free, no API key required
- Rate limit: ~1 request per second (handled automatically)
- Supports worldwide addresses
- Fallback to manual address entry if geocoding fails

## Troubleshooting

### Locations Not Showing
1. Check if `ADD-LOCATION-FIELDS.sql` was executed
2. Verify columns exist in database
3. Check browser console for geocoding errors
4. Ensure addresses are properly formatted

### Geocoding Failures
- Addresses may be too vague or incorrect
- Service may be rate-limited (wait 1-2 seconds)
- Check network connectivity
- Verify address format (include city, state, country)

### Map Not Displaying
- Google Maps Static API may require API key (optional)
- Falls back to OpenStreetMap automatically
- Check if coordinates are valid numbers
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` (optional)

## Configuration

### Optional: Google Maps API Key
For better map quality, add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note:** System works without API key using OpenStreetMap fallback.

## Best Practices

1. **Address Format**: Use complete addresses with city, state, and pincode
2. **Shop Registration**: Shopkeepers should enter accurate shop addresses during registration
3. **Customer Profile**: Encourage customers to set accurate delivery addresses
4. **Delivery Updates**: Delivery agents should update status regularly for tracking

## Future Enhancements

- Real-time location tracking of delivery agents
- Route optimization for multiple deliveries
- Estimated delivery time calculation
- Live map with moving markers
- Push notifications for delivery updates
- Distance-based delivery fee calculation

