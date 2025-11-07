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

// PUT - Approve or reject an organic vegetable
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, rejection_reason, approved_by } = body; // action: 'approve' or 'reject'
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Vegetable ID is required'
      }, { status: 400 });
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be either "approve" or "reject"'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    
    // Prepare update data
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString()
    };
    
    if (action === 'approve') {
      updateData.approved_by = approved_by || null;
      updateData.approved_at = new Date().toISOString();
      updateData.rejected_by = null;
      updateData.rejected_at = null;
      updateData.rejection_reason = null;
    } else {
      updateData.rejected_by = approved_by || null; // Reusing approved_by for rejected_by
      updateData.rejected_at = new Date().toISOString();
      updateData.approved_by = null;
      updateData.approved_at = null;
      updateData.rejection_reason = rejection_reason || null;
    }
    
    const { data: vegetable, error } = await supabase
      .from('organic_vegetables')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating organic vegetable:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to update vegetable'
      }, { status: 500 });
    }
    
    console.log(`✅ Organic vegetable ${action}d:`, id);
    
    return NextResponse.json({
      success: true,
      vegetable
    });
  } catch (error: any) {
    console.error('Error in PUT organic vegetable approval:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

