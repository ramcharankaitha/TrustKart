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

    // Find delivery agent
    const { data: deliveryAgent, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !deliveryAgent) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if agent is approved
    if (deliveryAgent.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: 'Your delivery agent application is still pending approval. Please wait for admin approval.'
      }, { status: 403 });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, deliveryAgent.password);

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Return delivery agent data - sessionStorage will be set on client side
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      deliveryAgent: {
        id: deliveryAgent.id,
        name: deliveryAgent.name,
        email: deliveryAgent.email,
        phone: deliveryAgent.phone,
        vehicleType: deliveryAgent.vehicle_type,
        status: deliveryAgent.status,
        isAvailable: deliveryAgent.is_available || false,
        rating: deliveryAgent.rating || 0,
        totalDeliveries: deliveryAgent.total_deliveries || 0
      }
    });

  } catch (error: any) {
    console.error('Delivery agent login error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
