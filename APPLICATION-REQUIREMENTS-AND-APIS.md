# TrustKart: Expiry-Aware Marketplace - Requirements, Modules & APIs

## 📋 Application Overview

**TrustKart** is an expiry-aware marketplace platform that connects customers with local shopkeepers, with special focus on managing product expiry dates, automated discount suggestions, and delivery management.

---

## 🎯 Core Requirements & Features

### 1. Role-Based Access Control (RBAC)
- **User Roles**: Customer, Shopkeeper, Admin, Super Admin, Delivery Agent, Farmer
- **Authentication**: Firebase Authentication with custom claims
- **Access Control**: Role-based feature restrictions and data access

### 2. Expiry Date Management
- Shopkeepers can set expiry dates for products
- Products filtered and displayed by expiry status
- Alerts for both customers and shopkeepers on expiring items
- Expiry indicators and warnings

### 3. Admin Approval Workflow
- Shopkeeper registration requires admin approval
- Document uploads (business license, GST, PAN, Aadhaar, shop photos)
- Status tracking in database (PENDING → APPROVED/REJECTED)
- Rejection reasons and review history

### 4. Real-time Order Management
- Real-time order status updates
- Order lifecycle: PENDING → APPROVED → PREPARING → READY → IN_TRANSIT → DELIVERED
- Status notifications for customers and shopkeepers
- Order cancellation support

### 5. Automated Expiry Checker
- Cloud Function to check expired products daily
- Automatic product status updates
- Refund task creation for expired items
- Notifications to affected parties

### 6. AI-Powered Expiry Discount Tool
- AI suggests automatic discounts for products nearing expiry
- Shop-specific discount rate configurations
- Threshold-based discount triggers
- Minimizes waste through intelligent pricing

### 7. Geo-fenced Delivery Assignment
- Real-time location tracking for delivery agents
- Nearby delivery agent suggestions based on location
- Automatic assignment to nearest available agent
- Manual delivery acceptance by agents

### 8. Delivery Management
- Complete delivery lifecycle tracking
- Photo proof upload for deliveries
- GPS location tracking (pickup and delivery)
- Delivery agent availability management

---

## 🏗️ Application Modules

### Module 1: User Management
**Purpose**: Handle user registration, authentication, and profile management

**Components**:
- Customer registration and login
- Shopkeeper registration with approval workflow
- Admin authentication
- Delivery agent registration and approval
- Profile management
- Address management

**Key Features**:
- Email/password authentication
- Password hashing with bcrypt
- Session management
- Role-based access

---

### Module 2: Shop Management
**Purpose**: Manage shop registrations, approvals, and shopkeeper operations

**Components**:
- Shop registration form
- Document upload system
- Admin approval interface
- Shop dashboard
- Shop status management

**Key Features**:
- Multi-step registration process
- Document verification
- Approval/rejection workflow
- Shop profile management

---

### Module 3: Product Management
**Purpose**: Manage product catalog, inventory, and expiry tracking

**Components**:
- Product creation and editing
- Inventory management
- Expiry date tracking
- Product categories
- Stock management

**Key Features**:
- Expiry date warnings
- Stock quantity tracking
- Product categorization
- Image uploads
- Price management

---

### Module 4: Order Management
**Purpose**: Handle order lifecycle from creation to delivery

**Components**:
- Shopping cart
- Order creation
- Order acceptance/rejection
- Order status tracking
- Order cancellation
- Stock deduction on order approval

**Key Features**:
- Real-time status updates
- Order history
- Payment integration
- Order cancellation with reasons
- Multi-item orders

---

### Module 5: Delivery Management
**Purpose**: Manage delivery assignments, tracking, and completion

**Components**:
- Delivery agent registration
- Delivery assignment system
- Delivery tracking
- Photo proof upload
- Location mapping

**Key Features**:
- Auto-assignment to nearest agent
- Manual delivery acceptance
- GPS tracking
- Delivery status updates
- Photo verification

---

### Module 6: Customer Management
**Purpose**: Customer account management and address handling

**Components**:
- Customer registration
- Address management
- Location services
- Order history
- Profile management

**Key Features**:
- Multiple address support
- Default address selection
- Location-based services
- Order tracking

---

### Module 7: Admin Dashboard
**Purpose**: Administrative oversight and management

**Components**:
- Shopkeeper approval interface
- Delivery agent approval
- User management
- Analytics dashboard
- Complaint management
- System settings

**Key Features**:
- Approval workflows
- Performance monitoring
- User analytics
- Complaint resolution

---

### Module 8: AI Chat Assistant
**Purpose**: AI-powered customer support and product suggestions

**Components**:
- Chat interface
- AI response generation
- Role-aware responses
- Chat history

**Key Features**:
- Context-aware responses
- Product suggestions
- Support queries
- Expiry discount suggestions

---

## 🌐 Complete API Documentation

### Authentication & User APIs

#### 1. Customer Registration
```
POST /api/customer/register (if exists)
Body: {
  name: string,
  email: string,
  password: string,
  phone?: string
}
```

#### 2. Customer Login
```
POST /api/login (via login page)
Body: {
  email: string,
  password: string
}
```

---

### Customer Address APIs

#### 3. Get Customer Addresses
```
GET /api/customer/addresses?customerId={id}
Response: {
  success: boolean,
  addresses: Address[]
}
```

#### 4. Create Customer Address
```
POST /api/customer/addresses
Body: {
  customerId: string,
  label?: string,
  fullName?: string,
  phone?: string,
  addressLine1: string,
  addressLine2?: string,
  city: string,
  state: string,
  pincode: string,
  country?: string,
  latitude?: number,
  longitude?: number,
  isDefault?: boolean
}
Response: {
  success: boolean,
  message: string,
  address: Address
}
```

#### 5. Get Single Address
```
GET /api/customer/addresses/[id]
Response: {
  success: boolean,
  address: Address
}
```

#### 6. Update Address
```
PUT /api/customer/addresses/[id]
Body: {
  label?: string,
  fullName?: string,
  phone?: string,
  addressLine1?: string,
  addressLine2?: string,
  city?: string,
  state?: string,
  pincode?: string,
  country?: string,
  latitude?: number,
  longitude?: number,
  isDefault?: boolean
}
Response: {
  success: boolean,
  message: string,
  address: Address
}
```

#### 7. Delete Address
```
DELETE /api/customer/addresses/[id]
Response: {
  success: boolean,
  message: string
}
```

---

### Customer Location APIs

#### 8. Save Customer Location
```
POST /api/customer/location
Body: {
  userId: string,
  latitude: number,
  longitude: number,
  address?: string,
  city?: string,
  state?: string,
  country?: string,
  pincode?: string
}
Response: {
  success: boolean,
  message: string,
  data: LocationData
}
```

#### 9. Get Customer Location
```
GET /api/customer/location?userId={id}
Response: {
  success: boolean,
  data: LocationData | null
}
```

---

### Delivery Agent APIs

#### 10. Get All Delivery Agents
```
GET /api/delivery-agents
Response: {
  success: boolean,
  deliveryAgents: DeliveryAgent[]
}
```

#### 11. Register Delivery Agent
```
POST /api/delivery-agents/register
Body (FormData): {
  name: string,
  email: string,
  password: string,
  phone: string,
  vehicleType: string,
  vehicleNumber?: string,
  licenseNumber?: string,
  aadhaarNumber?: string,
  address: string,
  city?: string,
  state?: string,
  pincode?: string,
  latitude?: number,
  longitude?: number,
  document_driving_license?: File,
  document_aadhaar_card?: File,
  document_vehicle_rc?: File,
  document_pan_card?: File,
  document_profile_photo?: File
}
Response: {
  success: boolean,
  message: string,
  deliveryAgent: DeliveryAgent,
  documents: Document[]
}
```

#### 12. Delivery Agent Login
```
POST /api/delivery-agents/login
Body: {
  email: string,
  password: string
}
Response: {
  success: boolean,
  message: string,
  deliveryAgent: DeliveryAgent
}
```

#### 13. Update Delivery Agent Availability
```
PUT /api/delivery-agents/availability
Body: {
  deliveryAgentId: string,
  isAvailable: boolean
}
Response: {
  success: boolean,
  message: string,
  deliveryAgent: DeliveryAgent
}
```

#### 14. Approve Delivery Agent
```
PUT /api/delivery-agents/[id]/approve
Response: {
  success: boolean,
  deliveryAgent: DeliveryAgent
}
```

#### 15. Reject Delivery Agent
```
PUT /api/delivery-agents/[id]/reject
Body: {
  reason?: string
}
Response: {
  success: boolean,
  deliveryAgent: DeliveryAgent
}
```

#### 16. Get Delivery Agent Documents
```
GET /api/delivery-agents/[id]/documents
Response: {
  success: boolean,
  documents: Document[]
}
```

---

### Delivery APIs

#### 17. Get Deliveries
```
GET /api/deliveries?deliveryAgentId={id}&status={status}&unassignedOnly={true|false}
Query Parameters:
  - deliveryAgentId (optional): Filter by agent ID
  - status (optional): Filter by status (ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, etc.)
  - unassignedOnly (optional): Get only unassigned deliveries (true/false)

Response: {
  success: boolean,
  deliveries: Delivery[]
}
```

#### 18. Create Delivery Assignment
```
POST /api/deliveries
Body: {
  orderId: string,
  deliveryAgentId?: string,
  deliveryAddress: string,
  deliveryPhone?: string,
  notes?: string
}
Response: {
  success: boolean,
  message: string,
  delivery: Delivery
}
```

#### 19. Update Delivery Status
```
PUT /api/deliveries
Body: {
  deliveryId: string,
  status?: string,
  deliveryAgentId?: string,
  notes?: string,
  pickup_latitude?: number,
  pickup_longitude?: number,
  delivery_latitude?: number,
  delivery_longitude?: number,
  delivery_photo_url?: string
}
Response: {
  success: boolean,
  message: string,
  delivery: Delivery
}
```

#### 20. Accept Delivery
```
POST /api/deliveries/accept
Body: {
  deliveryId: string,
  deliveryAgentId: string
}
Response: {
  success: boolean,
  message: string,
  delivery: Delivery
}
```

#### 21. Upload Delivery Photo
```
POST /api/deliveries/upload-photo
Body (FormData): {
  deliveryId: string,
  photo: File
}
Response: {
  success: boolean,
  message: string,
  photoUrl: string
}
```

---

### Order APIs

#### 22. Accept Order (Shopkeeper)
```
POST /api/orders/accept
Body: {
  orderId: string
}
Response: {
  success: boolean,
  message: string,
  delivery: Delivery,
  pickupLocation: Coordinates,
  deliveryLocation: Coordinates
}
```
**Note**: This endpoint also:
- Deducts stock for all order items
- Validates stock availability
- Creates delivery assignment
- Geocodes addresses if coordinates missing

#### 23. Cancel Order
```
POST /api/orders/[id]/cancel
Body: {
  cancellationReason: string,
  cancelledBy?: string
}
Response: {
  success: boolean,
  message: string,
  order: Order
}
```
**Note**: Only allows cancellation if order status is APPROVED or PAYMENT_PENDING

#### 24. Create Delivery Assignment (After Payment)
```
POST /api/orders/[id]/create-delivery
Response: {
  success: boolean,
  message: string,
  delivery: Delivery
}
```
**Note**: This endpoint:
- Auto-assigns to nearest available delivery agent
- Geocodes addresses if coordinates missing
- Updates order status to CONFIRMED
- Creates delivery record with location data

---

### AI Chat API

#### 25. AI Chat Response
```
POST /api/chat
Body: {
  message: string,
  userRole?: 'customer' | 'shopkeeper' | 'admin' | 'guest',
  chatHistory?: ChatMessage[]
}
Response: {
  success: boolean,
  response: string
}
```

---

### Database Setup APIs (Development/Testing)

#### 26. Setup Database
```
POST /api/setup-database
Response: {
  success: boolean,
  message: string
}
```

#### 27. Setup Customer Addresses
```
POST /api/setup-customer-addresses
Response: {
  success: boolean,
  message: string
}
```

#### 28. Setup Delivery Tables
```
POST /api/setup-delivery-tables
Response: {
  success: boolean,
  message: string
}
```

#### 29. Setup Foreign Keys
```
POST /api/setup-foreign-keys
Response: {
  success: boolean,
  message: string
}
```

#### 30. Fix Database Schema
```
POST /api/fix-database-schema
Response: {
  success: boolean,
  message: string
}
```

#### 31. Migrate Delivery Agents
```
POST /api/migrate-delivery-agents
Response: {
  success: boolean,
  message: string
}
```

---

### Test APIs (Development)

#### 32. Test Authentication
```
GET /api/test-auth
```

#### 33. Test Database
```
GET /api/test-database
```

#### 34. Test Registration
```
POST /api/test-registration
```

#### 35. Test Supabase
```
GET /api/test-supabase
```

---

## 📊 Database Schema

### Core Tables

1. **users**
   - id, email, name, password, phone, role, latitude, longitude, address, city, state, pincode, created_at, updated_at

2. **shops**
   - id, name, description, address, latitude, longitude, phone, email, status, owner_id, created_at, updated_at

3. **products**
   - id, name, description, price, quantity, category, expiry_date, shop_id, created_at, updated_at

4. **orders**
   - id, status, total_amount, customer_id, shop_id, delivery_address, delivery_phone, payment_method, payment_status, notes, request_type, customer_latitude, customer_longitude, shop_latitude, shop_longitude, created_at, updated_at

5. **order_items**
   - id, quantity, price, order_id, product_id, approval_status, rejection_reason

6. **delivery_agents**
   - id, email, name, password, phone, vehicle_type, vehicle_number, license_number, aadhaar_number, address, latitude, longitude, status, is_available, rating, total_deliveries, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at

7. **deliveries**
   - id, order_id, delivery_agent_id, status, assigned_at, picked_up_at, delivered_at, delivery_address, delivery_phone, pickup_address, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, delivery_photo_url, delivery_photo_uploaded_at, notes, rating, created_at, updated_at

8. **customer_addresses**
   - id, customer_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, country, latitude, longitude, is_default, created_at, updated_at

9. **delivery_agent_documents**
   - id, delivery_agent_id, document_type, document_name, document_url, file_size, file_type, is_verified, uploaded_at

10. **complaints**
    - id, title, description, status, priority, customer_id, shop_id, created_at, updated_at

---

## 🎨 Design System

### Color Palette
- **Primary Color**: #C6C21B (Saturated greenish-yellow - fresh produce theme)
- **Background Color**: #262605 (Desaturated dark greenish-yellow)
- **Accent Color**: #FFFF00 (Bright saturated yellow for interactive elements)

### Typography
- **Headline Font**: 'Belleza' (Humanist sans-serif, fashion-oriented)
- **Body Font**: 'Alegreya' (Humanist serif, elegant and contemporary)
- **Code Font**: 'Source Code Pro' (For code snippets)

### UI Guidelines
- Clean and organized layout
- Priority on key information (expiry dates, order status)
- Subtle animations for transitions
- Modern icons for categories and actions
- Responsive design for all devices

---

## 🔐 Security Features

- Password hashing with bcrypt
- Input validation and sanitization
- Role-based access control
- Session management
- SQL injection prevention
- XSS protection
- File upload validation
- API endpoint authentication

---

## 🚀 Technology Stack

- **Frontend**: Next.js 15.3.3, React 18.3.1
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Custom (bcrypt) + Supabase Auth
- **File Storage**: Supabase Storage
- **AI**: Google GenAI (Genkit)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Geocoding**: LocationIQ / Custom geocoding service

---

## 📱 Key User Flows

### Customer Flow
1. Register/Login
2. Browse products
3. Add to cart
4. Place order
5. Make payment
6. Track order
7. Receive delivery

### Shopkeeper Flow
1. Register shop
2. Upload documents
3. Wait for admin approval
4. Add products with expiry dates
5. Receive order notifications
6. Accept/reject orders
7. Update order status
8. Manage inventory

### Delivery Agent Flow
1. Register with documents
2. Wait for admin approval
3. Login
4. View available deliveries
5. Accept delivery assignment
6. Update delivery status
7. Upload delivery proof
8. Mark as delivered

### Admin Flow
1. Login
2. Review shopkeeper applications
3. Review delivery agent applications
4. Approve/reject applications
5. Monitor system analytics
6. Manage complaints
7. View reports

---

## 🔄 Order Status Flow

```
PENDING → APPROVED → PREPARING → READY → IN_TRANSIT → DELIVERED
         ↓
    PAYMENT_PENDING → PAID → CONFIRMED
         ↓
      CANCELLED (if cancelled)
```

## 🚚 Delivery Status Flow

```
ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
              ↓
          CANCELLED (if cancelled)
              ↓
           FAILED (if delivery fails)
```

---

## 📝 Notes

- All APIs use JSON responses with `success` boolean field
- Error responses include `error` field with message
- Most APIs require authentication (check session)
- Location data is optional but recommended for better service
- Stock is automatically deducted when order is approved
- Delivery assignments can be auto-assigned or manually accepted
- Photo proof is required before marking delivery as DELIVERED

---

## 🔗 Related Documentation

- `DELIVERY-AGENT-MODULE-README.md` - Detailed delivery agent module docs
- `CUSTOMER-ACCOUNT-TESTING-GUIDE.md` - Customer account testing guide
- `docs/blueprint.md` - Application blueprint
- SQL setup files in root directory for database initialization

---

**Last Updated**: Generated from codebase analysis
**Version**: 1.0

