# Delivery Agent Module - TrustKart

This module adds comprehensive delivery agent functionality to the TrustKart marketplace platform.

## Features

### 🚚 Delivery Agent Registration
- Complete registration form with personal information
- Vehicle details and documentation
- Address verification
- Automatic pending status (requires admin approval)

### 🔐 Authentication & Login
- Secure password hashing with bcrypt
- Role-based authentication
- Session management
- Approval status verification

### 📱 Delivery Agent Dashboard
- Real-time delivery assignments
- Status tracking (Assigned → Picked Up → In Transit → Delivered)
- Customer and shop information
- Availability toggle
- Performance metrics (rating, total deliveries)

### 🛠️ Admin Management
- Delivery agent approval/rejection
- Status management
- Performance monitoring

## Database Schema

### DeliveryAgent Model
```sql
- id: Unique identifier
- email: Unique email address
- name: Full name
- password: Hashed password
- phone: Contact number
- vehicle_type: Type of vehicle (bike, car, etc.)
- vehicle_number: Vehicle registration number
- license_number: Driving license number
- aadhaar_number: Aadhaar card number
- address: Full address
- status: PENDING/APPROVED/REJECTED/SUSPENDED
- is_available: Availability status
- rating: Average rating (0-5)
- total_deliveries: Count of completed deliveries
```

### Delivery Model
```sql
- id: Unique identifier
- order_id: Reference to order (unique)
- delivery_agent_id: Reference to delivery agent
- status: ASSIGNED/PICKED_UP/IN_TRANSIT/DELIVERED/FAILED/CANCELLED
- assigned_at: Assignment timestamp
- picked_up_at: Pickup timestamp
- delivered_at: Delivery timestamp
- delivery_address: Delivery address
- delivery_phone: Customer contact
- notes: Additional notes
- rating: Customer rating (1-5)
```

## API Endpoints

### Delivery Agent Registration
```
POST /api/delivery-agents/register
Body: {
  name, email, password, phone, vehicleType,
  vehicleNumber, licenseNumber, aadhaarNumber, address
}
```

### Delivery Agent Login
```
POST /api/delivery-agents/login
Body: { email, password }
```

### Update Availability
```
PUT /api/delivery-agents/availability
Body: { deliveryAgentId, isAvailable }
```

### Delivery Management
```
GET /api/deliveries?deliveryAgentId={id}&status={status}
POST /api/deliveries
PUT /api/deliveries
```

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the required tables:
```bash
# Execute the SQL file in your database
psql -d your_database -f delivery-agent-database-setup.sql
```

### 2. Environment Variables
Ensure your `.env` file has the required Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Prisma Schema
The Prisma schema has been updated with:
- DeliveryAgent model
- Delivery model
- New enums: DeliveryAgentStatus, DeliveryStatus
- Updated UserRole enum to include DELIVERY_AGENT

### 4. Generate Prisma Client
```bash
npx prisma generate
```

## Usage Flow

### For Delivery Agents
1. **Registration**: Visit `/delivery-agent-registration`
2. **Approval**: Wait for admin approval
3. **Login**: Use delivery agent credentials at `/login`
4. **Dashboard**: Access delivery assignments and manage status
5. **Availability**: Toggle availability for new assignments

### For Admins
1. **Review Applications**: Check pending delivery agent applications
2. **Approve/Reject**: Manage agent status
3. **Monitor Performance**: Track delivery metrics

## File Structure

```
src/
├── app/
│   ├── delivery-agent-registration/
│   │   └── page.tsx                 # Registration form
│   ├── api/
│   │   ├── delivery-agents/
│   │   │   ├── register/route.ts    # Registration API
│   │   │   ├── login/route.ts       # Login API
│   │   │   └── availability/route.ts # Availability API
│   │   └── deliveries/route.ts      # Delivery management API
│   └── login/page.tsx              # Updated login page
├── components/
│   └── delivery-agent-dashboard.tsx # Main dashboard component
└── lib/plugins/
    └── login-database-plugin.ts     # Updated authentication
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Role-based access control
- ✅ Session management
- ✅ SQL injection prevention
- ✅ XSS protection

## Testing

### Manual Testing Steps
1. Register a new delivery agent
2. Verify pending status
3. Login with delivery agent credentials
4. Check dashboard functionality
5. Test delivery status updates
6. Verify availability toggle

### Test Data
```sql
-- Sample delivery agent (for testing)
INSERT INTO delivery_agents (email, name, password, phone, vehicle_type, address, status, is_available)
VALUES ('test@delivery.com', 'Test Agent', '$2a$10$hashedpassword', '9876543210', 'bike', 'Test Address', 'APPROVED', true);
```

## Future Enhancements

- 📍 GPS tracking integration
- 📱 Mobile app for delivery agents
- 💰 Payment integration for delivery fees
- 📊 Advanced analytics and reporting
- 🔔 Real-time notifications
- 🗺️ Route optimization
- 📸 Photo verification for deliveries

## Troubleshooting

### Common Issues

1. **Login fails**: Check if delivery agent is approved
2. **No deliveries shown**: Verify delivery agent ID in session
3. **Database errors**: Ensure tables are created properly
4. **Session issues**: Check sessionStorage for deliveryAgentSession

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Confirm database connection
4. Check session storage contents

## Support

For issues or questions regarding the delivery agent module, please check:
1. Database connection and table structure
2. API endpoint responses
3. Session management
4. Prisma schema validation
