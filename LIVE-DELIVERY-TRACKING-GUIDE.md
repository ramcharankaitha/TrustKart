# Live Delivery Agent Tracking - Customer Guide

## Overview
Once a delivery agent accepts a delivery request, customers can track the agent's live location in real-time until the order is delivered.

## Where to View Live Tracking

### 1. **My Orders Page** (`/dashboard/my-orders`)
- **Location**: Dashboard → "My Orders" (accessible from customer navigation)
- **What you'll see**:
  - A blue information box showing "Delivery Agent Assigned" when an agent accepts your order
  - Agent name and phone number
  - Current delivery status (ASSIGNED, PICKED_UP, IN_TRANSIT)
  - A prominent **"Track Delivery"** button (blue button with navigation icon)
  - Auto-refreshes every 10 seconds to check for delivery assignments

### 2. **Order Details Page** (`/order-details/[orderId]`)
- **How to access**:
  - Click "View Details" or "Track Delivery" button from My Orders page
  - Direct URL: `/order-details/[your-order-id]`
- **What you'll see**:
  - **Live Delivery Tracking Card** (blue border) showing:
    - Delivery status and current stage
    - Agent information (name, phone, vehicle type)
    - Last location update timestamp
  - **Interactive Map** displaying:
    - 🟢 **Green marker (P)**: Pickup location (shop)
    - 🔴 **Red marker (D)**: Delivery location (your address)
    - 🔵 **Blue marker (A)**: Live delivery agent location (updates in real-time)
  - **Auto-refresh**: Map updates every 5 seconds automatically
  - **Tracking stops**: Automatically when delivery status becomes "DELIVERED"

## Features

### Real-Time Updates
- Location updates every 5 seconds on the order details page
- Location updates every 10 seconds on the orders list page
- No manual refresh needed - updates happen automatically

### Delivery Status Tracking
Customers can see the following statuses:
- **ASSIGNED**: Delivery agent has been assigned but hasn't picked up yet
- **PICKED_UP**: Agent has collected your order from the shop
- **IN_TRANSIT**: Order is on the way to you (live tracking active)
- **DELIVERED**: Order has been delivered (tracking stops)

### Agent Information
When tracking is active, customers can see:
- Agent's name
- Agent's phone number (clickable to call)
- Vehicle type (bike, car, etc.)
- Last location update time

### Map Features
- Static map preview (Google Maps or OpenStreetMap)
- All three locations visible at once:
  - Pickup location
  - Your delivery address
  - Agent's current location
- Map automatically centers on the agent's location when available
- Click "Navigate" buttons to open directions in Google Maps

## User Flow

```
1. Customer places order and completes payment
   ↓
2. Order status changes to PAID/PREPARING/READY
   ↓
3. Delivery agent accepts the delivery request
   ↓
4. Customer sees "Delivery Agent Assigned" notification in My Orders
   ↓
5. Customer clicks "Track Delivery" button
   ↓
6. Order Details page opens with live map
   ↓
7. Map updates every 5 seconds showing agent's location
   ↓
8. Customer can watch agent's progress in real-time
   ↓
9. Once delivered, tracking stops automatically
```

## Technical Details

### API Endpoints Used
- `GET /api/orders/[id]/tracking` - Fetches delivery agent location
- `POST /api/delivery-agents/[id]/location` - Updates agent location (used by agent dashboard)

### Location Update Frequency
- **Delivery Agent Dashboard**: Updates location continuously as agent moves
- **Customer Orders Page**: Checks for delivery assignment every 10 seconds
- **Order Details Page**: Fetches latest location every 5 seconds

### Requirements
- Customer must be logged in
- Order must have a delivery assignment (delivery_agent_id not null)
- Delivery status must be ASSIGNED, PICKED_UP, or IN_TRANSIT
- Delivery agent must have location tracking enabled in their browser

## Troubleshooting

### "Delivery Agent Assigned" not showing
- Wait a few moments - delivery assignment happens after payment
- Refresh the page
- Check if order status is PAID, PREPARING, or READY

### Map not showing agent location
- Agent may not have granted location permissions
- Agent may have closed their dashboard
- Location may not be available yet - wait a moment and refresh

### "Track Delivery" button not appearing
- Delivery agent may not have accepted the request yet
- Order may already be delivered
- Check order status in order details

## Notes
- Tracking only works when delivery agent has their dashboard open and location permissions granted
- Location updates are based on the agent's browser geolocation
- Map uses Google Maps Static API (requires API key) or falls back to OpenStreetMap
- All tracking data is stored securely in the database

