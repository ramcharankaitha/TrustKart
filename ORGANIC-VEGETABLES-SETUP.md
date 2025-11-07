# Organic Vegetables System Setup Guide

This guide explains how to set up and use the organic vegetables approval system.

## Overview

The organic vegetables system allows shopkeepers and farmers to submit organic vegetables for admin approval. Only approved vegetables are visible to customers.

## Database Setup

1. **Run the SQL script** to create the `organic_vegetables` table:
   ```sql
   -- Run this in your Supabase SQL editor
   -- File: CREATE-ORGANIC-VEGETABLES-TABLE.sql
   ```

2. **Table Structure:**
   - `id`: Unique identifier (TEXT)
   - `name`: Vegetable name (required)
   - `description`: Description of the vegetable
   - `price`: Price per unit (DECIMAL)
   - `unit`: Unit of measurement (kg, piece, bundle, etc.)
   - `category`: Category (Leafy Greens, Root Vegetables, etc.)
   - `image_url`: Base64 encoded image or URL
   - `nutritional_info`: JSONB field for nutritional data
   - `origin`: Farm location or origin
   - `certification`: Organic certification details
   - `farmer_name`: Name of farmer/supplier
   - `farmer_contact`: Contact information
   - `quantity_available`: Available quantity
   - `min_order_quantity`: Minimum order quantity
   - `status`: 'pending', 'approved', or 'rejected'
   - `submitted_by`: User ID who submitted
   - `shop_id`: Optional link to shop
   - `rejection_reason`: Reason for rejection (if rejected)
   - `approved_by`, `approved_at`: Admin who approved and when
   - `rejected_by`, `rejected_at`: Admin who rejected and when

## API Endpoints

### 1. GET `/api/organic-vegetables`
Fetch organic vegetables.

**Query Parameters:**
- `status`: Filter by status ('pending', 'approved', 'rejected')
- `includePending`: Set to 'true' to include pending vegetables (admin only)

**Response:**
```json
{
  "success": true,
  "vegetables": [...]
}
```

### 2. POST `/api/organic-vegetables`
Submit a new organic vegetable for approval.

**Request Body:**
```json
{
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "price": 50.00,
  "unit": "kg",
  "category": "Fruits",
  "image_url": "data:image/jpeg;base64,...",
  "nutritional_info": {
    "calories": 18,
    "protein": 0.9,
    "carbohydrates": 3.9,
    "fat": 0.2
  },
  "origin": "Local Farm, Karnataka",
  "certification": "NPOP Certified",
  "farmer_name": "John Farmer",
  "farmer_contact": "9876543210",
  "quantity_available": 100,
  "min_order_quantity": 1,
  "shop_id": "shop_123",
  "submitted_by": "user_123"
}
```

### 3. PUT `/api/organic-vegetables/[id]/approve`
Approve or reject an organic vegetable.

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "rejection_reason": "Reason for rejection (if rejecting)",
  "approved_by": "admin_user_id"
}
```

## User Interface

### 1. Add Organic Vegetable Page
**Route:** `/dashboard/add-organic-vegetable`

- Accessible to all logged-in users (shopkeepers, farmers, etc.)
- Form includes:
  - Basic information (name, description, price, unit, category)
  - Image upload
  - Origin & certification details
  - Farmer/supplier information
  - Nutritional information (optional)
- Submissions are automatically set to 'pending' status

### 2. Admin Approval Page
**Route:** `/dashboard/admin-approvals`

- New "Vegetables" tab added to the admin approvals dashboard
- Shows all pending vegetables
- Admin can:
  - View vegetable details (image, description, origin, certification, nutritional info)
  - Approve vegetables (makes them visible to customers)
  - Reject vegetables (with optional rejection reason)

## Workflow

1. **Submission:**
   - User navigates to `/dashboard/add-organic-vegetable`
   - Fills out the form with vegetable details
   - Submits for approval
   - Vegetable is created with `status: 'pending'`

2. **Admin Review:**
   - Admin navigates to `/dashboard/admin-approvals`
   - Clicks on "Vegetables" tab
   - Reviews pending vegetables
   - Approves or rejects each vegetable

3. **Customer View:**
   - Only approved vegetables are visible to customers
   - Customers can browse and purchase approved organic vegetables

## Features

- ✅ Admin approval workflow
- ✅ Image upload support (base64 encoding)
- ✅ Nutritional information tracking
- ✅ Origin and certification tracking
- ✅ Farmer/supplier information
- ✅ Quantity and pricing management
- ✅ Rejection reason tracking
- ✅ Approval/rejection timestamps

## Next Steps

To display approved vegetables to customers, you'll need to:
1. Create a page/component to display approved vegetables
2. Filter vegetables by `status: 'approved'` when fetching
3. Integrate with your existing product catalog or create a separate organic vegetables section

## Notes

- All vegetables start with `status: 'pending'`
- Only admins can approve/reject vegetables
- Rejected vegetables can be resubmitted (create a new entry)
- Image uploads are stored as base64 strings (consider using Supabase Storage for production)

