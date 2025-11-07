import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// PUT /api/delivery-agents/[id]/reject - Reject a delivery agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const body = await request.json();
    const { reason } = body;
    
    console.log('🔍 Rejecting delivery agent:', agentId, 'Reason:', reason);
    
    const supabase = getSupabaseClient();
    
    const { data: updatedAgent, error } = await supabase
      .from('delivery_agents')
      .update({
        status: 'REJECTED',
        is_available: false,
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error rejecting delivery agent:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    if (!updatedAgent) {
      return NextResponse.json({
        success: false,
        error: 'Delivery agent not found'
      }, { status: 404 });
    }

    console.log('✅ Delivery agent rejected successfully:', agentId);

    return NextResponse.json({
      success: true,
      deliveryAgent: {
        id: updatedAgent.id,
        name: updatedAgent.name,
        email: updatedAgent.email,
        phone: updatedAgent.phone,
        vehicleType: updatedAgent.vehicle_type,
        vehicleNumber: updatedAgent.vehicle_number,
        licenseNumber: updatedAgent.license_number,
        aadhaarNumber: updatedAgent.aadhaar_number,
        address: updatedAgent.address,
        status: updatedAgent.status?.toLowerCase() || 'rejected',
        isAvailable: updatedAgent.is_available || false,
        rating: updatedAgent.rating || 0,
        totalDeliveries: updatedAgent.total_deliveries || 0,
        createdAt: updatedAgent.created_at,
        updatedAt: updatedAgent.updated_at
      }
    });

  } catch (error: any) {
    console.error('❌ Error rejecting delivery agent:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
