import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// GET /api/delivery-agents/[id]/documents - Get documents for a specific delivery agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    console.log('🔍 Getting documents for delivery agent:', agentId);
    
    const supabase = getSupabaseClient();
    
    const { data: documents, error } = await supabase
      .from('delivery_agent_documents')
      .select('*')
      .eq('delivery_agent_id', agentId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching documents:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        documents: []
      }, { status: 500 });
    }

    console.log('✅ Successfully fetched documents:', documents?.length || 0);

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get documents',
      documents: []
    }, { status: 500 });
  }
}
