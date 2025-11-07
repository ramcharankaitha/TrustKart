# Fix: Delivery Photo Upload Error

## Problem
Error: "Could not find the 'delivery_photo_uploaded_at' column of 'deliveries' in the schema cache"

This error occurs when the database column `delivery_photo_uploaded_at` doesn't exist in the `deliveries` table.

## Solution

### Option 1: Add the Missing Column (Recommended)
Run this SQL script in your Supabase SQL Editor:

```sql
-- Add delivery_photo_uploaded_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'delivery_photo_uploaded_at'
    ) THEN
        ALTER TABLE deliveries 
        ADD COLUMN delivery_photo_uploaded_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Added delivery_photo_uploaded_at column';
    END IF;
END $$;
```

Or run the complete script: `ADD-DELIVERY-PHOTO-COLUMN.sql`

### Option 2: Code Already Handles Missing Column (Current Fix)
The code has been updated to work even if the column doesn't exist:
- Photo upload will work without the timestamp column
- Only `delivery_photo_url` is required
- The timestamp column is optional

## What Was Fixed

1. **Photo Upload API** (`/api/deliveries/upload-photo/route.ts`)
   - Now handles missing `delivery_photo_uploaded_at` column gracefully
   - Falls back to updating only `delivery_photo_url` if timestamp column doesn't exist

2. **Delivery Update API** (`/api/deliveries/route.ts`)
   - Removed requirement for `delivery_photo_uploaded_at` when updating delivery status
   - Photo URL can be saved without the timestamp

3. **Error Handling**
   - Detects missing column errors
   - Automatically retries without the optional timestamp field
   - Shows clear error messages

## Testing

After applying the fix:
1. Try uploading a delivery photo
2. Should work even without `delivery_photo_uploaded_at` column
3. Photo URL will be saved successfully
4. No more "schema cache" errors

## Recommendation

While the code now works without the column, it's recommended to add the column for better tracking:
- Run `ADD-DELIVERY-PHOTO-COLUMN.sql` to add both:
  - `delivery_photo_url` (if missing)
  - `delivery_photo_uploaded_at` (if missing)

This allows you to track when photos were uploaded, which is useful for auditing.

