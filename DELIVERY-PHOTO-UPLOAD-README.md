# Delivery Photo Upload Feature

## Overview
Delivery agents are now required to upload a proof photo before marking a delivery as completed. This provides visual confirmation of successful delivery.

## Features

### 1. Photo Upload Requirement
- **Mandatory**: Photo must be uploaded before marking delivery as "DELIVERED"
- **Validation**: 
  - Image files only (JPG, PNG, WEBP)
  - Maximum file size: 5MB
  - Camera capture supported on mobile devices

### 2. Upload Methods
- **Live Camera Capture**: 
  - Click "Take Photo" button to activate camera
  - Live camera preview with real-time view
  - "Capture Photo" button to take the picture
  - Automatically stops camera after capture
  - Works on mobile and desktop devices
- **File Upload**: 
  - Click "Upload Photo" button to select existing photo
  - Supports camera capture through file input (mobile)
  - Choose from device gallery
- **Preview**: See photo before uploading (both methods)

### 3. Storage
- **Primary**: Supabase Storage bucket (`delivery-proofs`)
- **Fallback**: Base64 storage in database if bucket doesn't exist
- **URL Storage**: Photo URL saved in `delivery_photo_url` column

## Database Setup

### Step 1: Run SQL Script
Run `ADD-DELIVERY-PHOTO-COLUMN.sql` in your Supabase SQL Editor:

```sql
-- This adds:
-- - delivery_photo_url (TEXT) - stores photo URL
-- - delivery_photo_uploaded_at (TIMESTAMP) - upload timestamp
```

### Step 2: Create Storage Bucket (Optional but Recommended)
1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `delivery-proofs`
3. Set bucket to **Public** (or configure RLS policies)
4. If bucket doesn't exist, system will use base64 storage automatically

## How It Works

### For Delivery Agents:

1. **Complete Delivery Journey**:
   - Pick up order → Status: PICKED_UP
   - Start delivery → Status: IN_TRANSIT
   - **Click "Mark as Delivered (Upload Photo)"** → Opens photo upload dialog

2. **Upload Photo** (Two Options):
   
   **Option A - Take Photo with Camera:**
   - Click "Take Photo" button
   - Camera activates with live preview
   - Click "Capture Photo" when ready
   - Photo preview appears automatically
   
   **Option B - Upload Existing Photo:**
   - Click "Upload Photo" button
   - Select photo from device or take new one
   - Photo preview appears
   
   **Then:**
   - Review photo preview
   - Click "Upload & Mark Delivered"
   - Photo uploads and delivery status updates to DELIVERED

3. **View Photo**:
   - Completed deliveries show the proof photo
   - Photo displays with upload timestamp

### API Flow:

1. **Upload Photo** (`POST /api/deliveries/upload-photo`):
   - Validates file (type, size)
   - Uploads to Supabase Storage
   - Falls back to base64 if storage unavailable
   - Returns photo URL

2. **Update Status** (`PUT /api/deliveries`):
   - When status = 'DELIVERED':
     - Checks if photo URL is provided
     - If not, checks if delivery already has photo
     - Rejects if no photo exists
     - Updates status and saves photo URL

## UI Components

### Photo Upload Dialog
- **Modal Dialog**: Opens when clicking "Mark as Delivered (Upload Photo)"
- **Features**:
  - **Live Camera Preview**: Real-time camera view when "Take Photo" is active
  - **Two Action Buttons**: 
    - "Take Photo" - Activates camera with live preview
    - "Upload Photo" - Select existing photo from device
  - **Photo Preview**: Shows captured/selected photo before upload
  - **Capture Button**: Appears when camera is active to capture the photo
  - **Upload Progress**: Shows during photo upload
  - **Cancel and Upload Buttons**: At the bottom of dialog

### Delivery Card
- **Photo Display**: Shows uploaded photo for DELIVERED status
- **Upload Timestamp**: Shows when photo was uploaded
- **Button**: "Mark as Delivered (Upload Photo)" for IN_TRANSIT status

## Error Handling

- **No Photo Selected**: Button disabled until photo is selected
- **Invalid File Type**: Error message shown
- **File Too Large**: Error message (max 5MB)
- **Upload Failure**: Error shown, delivery status not updated
- **Storage Unavailable**: Automatically falls back to base64 storage

## Security Considerations

1. **File Validation**: 
   - Type checking (image only)
   - Size limits (5MB)
   - Filename sanitization

2. **Storage Access**:
   - Consider RLS policies for storage bucket
   - Public bucket for simplicity (can be restricted later)

3. **Photo Verification**:
   - Photos are stored permanently
   - Can be used for dispute resolution
   - Timestamped for audit trail

## Testing Checklist

- [ ] Database columns added successfully
- [ ] Photo upload dialog opens correctly
- [ ] Live camera preview works when "Take Photo" is clicked
- [ ] "Capture Photo" button captures photo successfully
- [ ] Camera stops automatically after capture
- [ ] File input camera capture works on mobile (fallback)
- [ ] File selection works
- [ ] Photo preview displays correctly
- [ ] Upload succeeds to Supabase Storage
- [ ] Base64 fallback works if storage unavailable
- [ ] Delivery status updates to DELIVERED after upload
- [ ] Photo displays on completed delivery
- [ ] Cannot mark as DELIVERED without photo
- [ ] Error messages display correctly

## Troubleshooting

### Issue: "Storage bucket not found"
**Solution**: 
- Create bucket in Supabase Dashboard
- Or system will use base64 storage automatically

### Issue: "Photo upload failed"
**Solution**:
- Check file size (must be < 5MB)
- Check file type (must be image)
- Check network connection
- Check browser console for errors

### Issue: "Cannot mark as delivered"
**Solution**:
- Ensure photo is uploaded first
- Check that photo upload API succeeded
- Verify delivery_photo_url is saved in database

## Future Enhancements

- Photo compression before upload
- Multiple photos per delivery
- Photo editing/cropping
- OCR text extraction from package labels
- Photo verification by admin
- Customer photo verification

