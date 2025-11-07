import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDB } from '@/lib/supabase-db';

/**
 * Get order by ID
 * GET /api/orders/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const { data: order, error } = await SupabaseDB.getOrderById(orderId);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message || 'Order not found',
        order: null
      }, { status: 404 });
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        order: null
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

