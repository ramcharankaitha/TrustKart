import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Save customer location to profile
 * POST /api/customer/location
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude, address, city, state, country, pincode } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Update user location
    const { data, error } = await supabase
      .from('users')
      .update({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving location:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to save location'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Location saved successfully',
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode
      }
    });

  } catch (error: any) {
    console.error('Error in location API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * Get customer location
 * GET /api/customer/location?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('latitude, longitude, address, city, state, pincode')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch location'
      }, { status: 500 });
    }

    if (!data.latitude || !data.longitude) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No location found'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode
      }
    });

  } catch (error: any) {
    console.error('Error in location API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

