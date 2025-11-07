import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Upload delivery proof photo
 * This endpoint handles photo uploads for delivery proof
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deliveryId = formData.get('deliveryId') as string;
    const photoFile = formData.get('photo') as File;

    if (!deliveryId) {
      return NextResponse.json({
        success: false,
        error: 'Delivery ID is required'
      }, { status: 400 });
    }

    if (!photoFile) {
      return NextResponse.json({
        success: false,
        error: 'Photo file is required'
      }, { status: 400 });
    }

    // Validate file type
    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'File must be an image'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (photoFile.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'Image size must be less than 5MB'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify delivery exists
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id')
      .eq('id', deliveryId)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json({
        success: false,
        error: 'Delivery not found'
      }, { status: 404 });
    }

    // Upload to Supabase Storage
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `delivery-${deliveryId}-${Date.now()}.${fileExt}`;
    const filePath = `delivery-proofs/${fileName}`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('delivery-proofs')
      .upload(filePath, buffer, {
        contentType: photoFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      
      // If bucket doesn't exist, create it (this might fail, but we'll try)
      // For now, fallback to base64 storage in database
      console.log('⚠️ Storage bucket might not exist, using base64 fallback');
      
      // Convert to base64 as fallback
      const base64 = Buffer.from(buffer).toString('base64');
      const base64Url = `data:${photoFile.type};base64,${base64}`;

      // Update delivery with base64 photo
      // Try with timestamp first, fallback to without if column doesn't exist
      let updateData: any = {
        delivery_photo_url: base64Url
      };
      
      // Try to include timestamp - if column doesn't exist, it will be ignored
      const { error: updateError } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (updateError) {
        // If error is about missing column, try without timestamp
        if (updateError.message?.includes('delivery_photo_uploaded_at') || 
            updateError.message?.includes('column') ||
            updateError.message?.includes('schema cache')) {
          console.log('⚠️ delivery_photo_uploaded_at column not found, updating without timestamp');
          const { error: retryError } = await supabase
            .from('deliveries')
            .update({ delivery_photo_url: base64Url })
            .eq('id', deliveryId);
          
          if (retryError) {
            console.error('Error saving base64 photo:', retryError);
            return NextResponse.json({
              success: false,
              error: 'Failed to save photo: ' + retryError.message
            }, { status: 500 });
          }
        } else {
          console.error('Error saving base64 photo:', updateError);
          return NextResponse.json({
            success: false,
            error: 'Failed to save photo: ' + updateError.message
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Photo uploaded successfully (stored as base64)',
        photoUrl: base64Url
      });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('delivery-proofs')
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    // Update delivery with photo URL
    // Try with timestamp first, fallback to without if column doesn't exist
    let updateData: any = {
      delivery_photo_url: photoUrl
    };
    
    // Try to include timestamp - if column doesn't exist, it will be ignored
    const { error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', deliveryId);

    if (updateError) {
      // If error is about missing column, try without timestamp
      if (updateError.message?.includes('delivery_photo_uploaded_at') || 
          updateError.message?.includes('column') ||
          updateError.message?.includes('schema cache')) {
        console.log('⚠️ delivery_photo_uploaded_at column not found, updating without timestamp');
        const { error: retryError } = await supabase
          .from('deliveries')
          .update({ delivery_photo_url: photoUrl })
          .eq('id', deliveryId);
        
        if (retryError) {
          console.error('Error updating delivery with photo URL:', retryError);
          return NextResponse.json({
            success: false,
            error: 'Failed to update delivery: ' + retryError.message
          }, { status: 500 });
        }
      } else {
        console.error('Error updating delivery with photo URL:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update delivery: ' + updateError.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl
    });

  } catch (error: any) {
    console.error('Error uploading delivery photo:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

