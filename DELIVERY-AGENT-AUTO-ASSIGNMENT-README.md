# Delivery Agent Auto-Assignment and Navigation Features

## Overview
This document describes the implementation of automatic delivery agent assignment and enhanced navigation features in the application.

## Features Implemented

### 1. Automatic Delivery Agent Assignment
When a customer completes payment for an order:
- The system automatically creates a delivery assignment
- The system finds available delivery agents (status: APPROVED, is_available: true)
- If agents have location data, the system calculates the nearest agent using the Haversine formula
- The delivery is automatically assigned to the nearest available agent
- If no agents are available or no location data exists, the delivery remains unassigned and available for manual acceptance

**Location**: `tk-main/src/app/api/orders/[id]/create-delivery/route.ts`

### 2. Enhanced Navigation System
The delivery agent dashboard now includes:

#### A. Current Location Tracking
- Uses browser Geolocation API to get the delivery agent's current location
- Stores location in localStorage for persistence
- Continuously watches position updates while the dashboard is open
- Falls back to stored location if geolocation is unavailable

#### B. Status-Based Navigation
**When Status is ASSIGNED (Before Pickup):**
- Shows "Pickup Location (Shopkeeper)" section
- Displays shop name, address, and phone number
- "Navigate to Shop" button opens Google Maps with:
  - Origin: Delivery agent's current location
  - Destination: Shopkeeper location
- Instructions: "Navigate from your current location to this shop to pick up the order"

**When Status is PICKED_UP or IN_TRANSIT (After Pickup):**
- Shows "Delivery Location (Customer)" section
- Displays customer name, address, and phone number
- "Navigate to Customer" button opens Google Maps with:
  - Origin: Delivery agent's current location (or shop location as fallback)
  - Destination: Customer location
- Instructions: "Navigate to customer's location to deliver the order"

**Location**: `tk-main/src/components/delivery-agent-dashboard.tsx`

### 3. Delivery Assignment Flow

```
Customer Payment → Order Status: PAID
    ↓
Create Delivery Assignment
    ↓
Find Available Agents → Calculate Distance → Assign Nearest Agent
    ↓
Delivery Status: ASSIGNED
    ↓
Delivery Agent Dashboard Shows Assignment
    ↓
Agent Navigates to Shop → Status: PICKED_UP
    ↓
Agent Navigates to Customer → Status: IN_TRANSIT
    ↓
Order Delivered → Status: DELIVERED
```

## Database Schema

### Deliveries Table
The following fields are used for location tracking:
- `pickup_latitude` / `pickup_longitude` - Shopkeeper location
- `pickup_address` - Shopkeeper address
- `delivery_latitude` / `delivery_longitude` - Customer location
- `delivery_address` - Customer address
- `delivery_agent_id` - Assigned agent (NULL if unassigned)

### Delivery Agents Table (Optional Enhancement)
To enable better distance calculation, you can add location fields:
- `latitude` / `longitude` - Agent's current location
- `last_location_update` - Timestamp of last location update

**SQL Script**: `tk-main/ADD-DELIVERY-AGENT-LOCATION.sql`

## API Endpoints

### POST `/api/orders/[id]/create-delivery`
Creates a delivery assignment and auto-assigns to nearest available agent.

**Request**: Automatically called after payment
**Response**:
```json
{
  "success": true,
  "message": "Delivery assignment created successfully",
  "delivery": {
    "id": "...",
    "delivery_agent_id": "agent_id" or null,
    "status": "ASSIGNED",
    ...
  }
}
```

### GET `/api/deliveries?deliveryAgentId={id}`
Returns deliveries assigned to a specific agent.

### GET `/api/deliveries?unassignedOnly=true`
Returns deliveries available for acceptance (delivery_agent_id is NULL).

## User Experience

### For Delivery Agents:
1. **Auto-Assigned Deliveries**: Automatically appear in "Active Deliveries" section
2. **Manual Acceptance**: Unassigned deliveries appear in "New Orders" section
3. **Navigation**: Click navigation buttons to open Google Maps with directions
4. **Location Permission**: Browser will request location permission on first use

### For Customers:
- After payment, delivery is automatically assigned to the nearest agent
- No action required - delivery agent will be notified

## Technical Details

### Distance Calculation
Uses Haversine formula to calculate distance between two points:
```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2( √a, √(1−a) )
d = R ⋅ c
```
Where:
- φ is latitude
- λ is longitude
- R is Earth's radius (6371 km)

### Navigation URLs
Google Maps Directions API format:
```
https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={lat},{lng}
```

### Geolocation API
- `getCurrentPosition()` - Gets initial location
- `watchPosition()` - Continuously updates location
- Falls back to localStorage if geolocation unavailable
- High accuracy enabled for better navigation

## Testing Checklist

- [ ] Customer completes payment → Delivery auto-assigned
- [ ] Delivery agent sees assignment in dashboard
- [ ] Navigation to shop works correctly
- [ ] Navigation to customer works after pickup
- [ ] Location tracking works (check browser permissions)
- [ ] Fallback to manual assignment if no agents available
- [ ] Distance calculation works for multiple agents
- [ ] Status updates correctly (ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED)

## Future Enhancements

1. **Real-time Location Updates**: Store agent location in database for real-time tracking
2. **Advanced Routing**: Use routing APIs for optimized delivery routes
3. **Multi-stop Deliveries**: Support multiple pickups/deliveries in one route
4. **ETA Calculation**: Show estimated arrival times based on distance and traffic
5. **Push Notifications**: Notify agents when new deliveries are assigned

