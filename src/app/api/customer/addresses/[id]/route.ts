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
 * GET /api/customer/addresses/[id]
 * Get a specific address by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = getSupabaseClient();

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching address:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Address not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      address
    });

  } catch (error: any) {
    console.error('Error in GET address API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * PUT /api/customer/addresses/[id]
 * Update an address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      latitude,
      longitude,
      isDefault
    } = body;

    const supabase = getSupabaseClient();

    // First get the address to check customer_id
    const { data: existingAddress, error: fetchError } = await supabase
      .from('customer_addresses')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAddress) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 });
    }

    // If this is being set as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', existingAddress.customer_id)
        .eq('is_default', true)
        .neq('id', id);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (label !== undefined) updateData.label = label;
    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (addressLine1 !== undefined) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (country !== undefined) updateData.country = country;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to update address'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      address
    });

  } catch (error: any) {
    console.error('Error in PUT address API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/customer/addresses/[id]
 * Delete an address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting address:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to delete address'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in DELETE address API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

