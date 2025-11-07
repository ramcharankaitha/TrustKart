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
 * PUT /api/customer/addresses/[id]/default
 * Set an address as default (unsetting others automatically)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = getSupabaseClient();

    // First get the address to check customer_id
    const { data: address, error: fetchError } = await supabase
      .from('customer_addresses')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !address) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 });
    }

    // Unset all other default addresses for this customer
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', address.customer_id)
      .neq('id', id);

    // Set this address as default
    const { data: updatedAddress, error } = await supabase
      .from('customer_addresses')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error setting default address:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to set default address'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Default address updated successfully',
      address: updatedAddress
    });

  } catch (error: any) {
    console.error('Error in PUT default address API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

