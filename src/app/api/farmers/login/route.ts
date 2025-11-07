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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Find farmer
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !farmer) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if farmer is approved
    if (farmer.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: 'Your farmer application is still pending approval. Please wait for admin approval.'
      }, { status: 403 });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, farmer.password);

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Return farmer data - sessionStorage will be set on client side
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      farmer: {
        id: farmer.id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        farmName: farmer.farm_name,
        status: farmer.status,
        isActive: farmer.is_active || false,
        rating: farmer.rating || 0,
        totalVegetablesSubmitted: farmer.total_vegetables_submitted || 0,
        totalVegetablesApproved: farmer.total_vegetables_approved || 0
      }
    });

  } catch (error: any) {
    console.error('Farmer login error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

