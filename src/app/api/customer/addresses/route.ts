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
 * GET /api/customer/addresses?customerId=xxx
 * Get all addresses for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: addresses, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch addresses'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      addresses: addresses || []
    });

  } catch (error: any) {
    console.error('Error in GET addresses API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * POST /api/customer/addresses
 * Create a new address for a customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
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

    if (!customerId || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID, address line 1, city, state, and pincode are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // If this is being set as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('is_default', true);
    }

    const addressData: any = {
      customer_id: customerId,
      label: label || null,
      full_name: fullName || null,
      phone: phone || null,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      state,
      pincode,
      country: country || 'India',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      is_default: isDefault || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .insert([addressData])
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to create address'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address created successfully',
      address
    });

  } catch (error: any) {
    console.error('Error in POST addresses API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

