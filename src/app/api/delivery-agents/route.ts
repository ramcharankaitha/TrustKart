import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// GET /api/delivery-agents - Get all delivery agents
export async function GET() {
  try {
    console.log('🔍 API: Getting all delivery agents...');
    const supabase = getSupabaseClient();
    
      const { data: deliveryAgents, error } = await supabase
        .from('delivery_agents')
        .select(`
          id,
          email,
          name,
          phone,
          vehicle_type,
          vehicle_number,
          license_number,
          aadhaar_number,
          address,
          status,
          is_available,
          rating,
          total_deliveries,
          rejection_reason,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching delivery agents:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        deliveryAgents: []
      }, { status: 500 });
    }

    console.log('✅ Successfully fetched delivery agents:', deliveryAgents?.length || 0);
    
      // Transform the data to match the expected format
      const transformedAgents = (deliveryAgents || []).map(agent => ({
        id: agent.id,
        email: agent.email,
        name: agent.name,
        phone: agent.phone,
        vehicleType: agent.vehicle_type,
        vehicleNumber: agent.vehicle_number,
        licenseNumber: agent.license_number,
        aadhaarNumber: agent.aadhaar_number,
        address: agent.address,
        status: agent.status?.toLowerCase() || 'pending',
        isAvailable: agent.is_available || false,
        rating: agent.rating || 0,
        totalDeliveries: agent.total_deliveries || 0,
        rejectionReason: agent.rejection_reason,
        reviewedBy: agent.reviewed_by,
        reviewedAt: agent.reviewed_at,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      }));

    return NextResponse.json({
      success: true,
      deliveryAgents: transformedAgents
    });

  } catch (error: any) {
    console.error('❌ Error fetching delivery agents:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get delivery agents',
      deliveryAgents: []
    }, { status: 500 });
  }
}

// POST /api/delivery-agents - Create a new delivery agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadhaarNumber,
      address
    } = body;

    // Validate required fields
    if (!name || !email || !password || !phone || !vehicleType || !address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, password, phone, vehicleType, address'
      }, { status: 400 });
    }

    // Check if delivery agent already exists
    const supabase = getSupabaseClient();
    const { data: existingAgent, error: checkError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAgent) {
      return NextResponse.json({
        success: false,
        error: 'A delivery agent with this email already exists'
      }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create delivery agent
    const { data: deliveryAgent, error } = await supabase
      .from('delivery_agents')
      .insert([{
        name,
        email,
        password: passwordHash,
        phone,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        license_number: licenseNumber,
        aadhaar_number: aadhaarNumber,
        address,
        status: 'PENDING', // Always pending approval
        is_available: false, // Not available until approved
        rating: 0,
        total_deliveries: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Delivery agent creation error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Delivery agent created successfully:', deliveryAgent.id);

    return NextResponse.json({
      success: true,
      deliveryAgent: {
        id: deliveryAgent.id,
        name: deliveryAgent.name,
        email: deliveryAgent.email,
        phone: deliveryAgent.phone,
        vehicleType: deliveryAgent.vehicle_type,
        vehicleNumber: deliveryAgent.vehicle_number,
        licenseNumber: deliveryAgent.license_number,
        aadhaarNumber: deliveryAgent.aadhaar_number,
        address: deliveryAgent.address,
        status: deliveryAgent.status?.toLowerCase() || 'pending',
        isAvailable: deliveryAgent.is_available || false,
        rating: deliveryAgent.rating || 0,
        totalDeliveries: deliveryAgent.total_deliveries || 0,
        createdAt: deliveryAgent.created_at,
        updatedAt: deliveryAgent.updated_at
      }
    });

  } catch (error: any) {
    console.error('Error creating delivery agent:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
