# Delivery Agent Mapping Fix

## Problem
The delivery agent mapping was failing with "Order not found" error after payment. This was caused by:
1. Missing database columns for location tracking
2. Timing issues where the order status update wasn't committed before delivery creation
3. Missing location columns in orders, deliveries, and delivery_agents tables

## Solution

### 1. Complete Database Setup
Run the `COMPLETE-DELIVERY-AGENT-SETUP.sql` script to ensure all required tables and columns exist:

```sql
-- Run this script in your Supabase SQL editor
-- This will create/add:
-- - delivery_agents table with location columns
-- - deliveries table with pickup/delivery location columns
-- - Location columns in orders table (customer_latitude, customer_longitude, shop_latitude, shop_longitude)
-- - Location columns in shops table
-- - Location columns in users table
-- - Location columns in delivery_agents table
-- - All necessary indexes for performance
```

### 2. Code Fixes

#### a) Order Status Update (`supabase-db.ts`)
- Added `updated_at` field update to ensure timestamp is tracked
- Added verification logging for successful updates

#### b) Create Delivery API (`create-delivery/route.ts`)
- Added retry logic (3 attempts with 500ms delay) to handle timing issues
- Improved error logging to identify issues
- Better handling of order lookup failures

#### c) Payment Page (`payment/[id]/page.tsx`)
- Added verification that order status update succeeded before proceeding
- Added small delays to ensure database consistency
- Better error handling and user feedback

## How to Apply the Fix

### Step 1: Run Database Setup
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `COMPLETE-DELIVERY-AGENT-SETUP.sql`
4. Run the script
5. Verify all tables and columns were created successfully

### Step 2: Fix Schema Relationships (IMPORTANT!)
1. In Supabase SQL Editor, run `FIX-SCHEMA-RELATIONSHIPS.sql`
2. This ensures foreign key relationships are properly set up
3. **Refresh Supabase Schema Cache:**
   - Go to Settings > API
   - Click "Reload schema" or wait 2-3 minutes for auto-refresh
   - This is required for nested selects to work

### Step 3: Test the Flow
1. Create an order as a customer
2. Approve the order as a shopkeeper
3. Complete payment as a customer
4. Check that delivery assignment is created automatically
5. Verify delivery agent can see the delivery in their dashboard

## Database Schema

### Required Columns in `orders` table:
- `customer_latitude` (DECIMAL 10,8)
- `customer_longitude` (DECIMAL 11,8)
- `shop_latitude` (DECIMAL 10,8)
- `shop_longitude` (DECIMAL 11,8)
- `status` (TEXT - should be 'PAID' or 'CONFIRMED' for delivery creation)
- `updated_at` (TIMESTAMP)

### Required Columns in `deliveries` table:
- `order_id` (TEXT, UNIQUE, REFERENCES orders(id))
- `delivery_agent_id` (TEXT, REFERENCES delivery_agents(id), nullable)
- `status` (TEXT - 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', etc.)
- `pickup_address` (TEXT)
- `pickup_latitude` (DECIMAL 10,8)
- `pickup_longitude` (DECIMAL 11,8)
- `delivery_address` (TEXT)
- `delivery_latitude` (DECIMAL 10,8)
- `delivery_longitude` (DECIMAL 11,8)
- `assigned_at` (TIMESTAMP)

### Required Columns in `delivery_agents` table:
- `status` (TEXT - must be 'APPROVED' for auto-assignment)
- `is_available` (BOOLEAN - must be true for auto-assignment)
- `latitude` (DECIMAL 10,8) - current location
- `longitude` (DECIMAL 11,8) - current location

## Code Improvements

### Fallback Query System
The create-delivery API now has a smart fallback system:
1. **First attempt**: Uses nested select syntax (requires foreign keys)
2. **If relationship error**: Automatically falls back to separate queries
3. This ensures it works even if Supabase schema cache hasn't refreshed

### Automatic Delivery Agent Assignment
After payment completion:
1. Order status is updated to 'PAID'
2. Delivery assignment is automatically created
3. Nearest available delivery agent is auto-assigned (if coordinates available)
4. If no agent available, delivery is created and available for manual acceptance

## Troubleshooting

### Issue: "Could not find a relationship between 'orders' and 'shops'"
**Solution:**
1. Run `FIX-SCHEMA-RELATIONSHIPS.sql` script
2. Go to Supabase Dashboard > Settings > API
3. Click "Reload schema" button
4. Wait 2-3 minutes for schema cache to refresh
5. The API will automatically use separate queries as fallback if needed

### Issue: "Order not found" error persists
1. Check that the order status is actually 'PAID' or 'CONFIRMED' in the database
2. Verify the order ID is correct
3. Check browser console for detailed error messages
4. Ensure database connection is working

### Issue: Delivery agent not auto-assigned
1. Check that there are delivery agents with `status = 'APPROVED'` and `is_available = true`
2. Verify delivery agents have location data (latitude/longitude)
3. Check that pickup coordinates are available (shop location)

### Issue: Location columns missing
1. Run the `COMPLETE-DELIVERY-AGENT-SETUP.sql` script again
2. Check if columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';`
3. Manually add missing columns if needed

## Testing Checklist

- [ ] Database setup script runs successfully
- [ ] Order can be created
- [ ] Order can be approved
- [ ] Payment updates order status to 'PAID'
- [ ] Delivery assignment is created automatically after payment
- [ ] Delivery agent can see the delivery in their dashboard
- [ ] Location coordinates are populated for pickup and delivery
- [ ] Auto-assignment works when delivery agents are available

## Notes

- The system will automatically geocode addresses if coordinates are missing
- Delivery agents without location data can still accept deliveries manually
- The retry logic ensures timing issues are handled gracefully
- All location data is stored in decimal degrees format

