import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDB } from '@/lib/supabase-db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    const body = await request.json();
    const { cancellationReason, cancelledBy } = body;

    if (!cancellationReason || cancellationReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Get order to check current status
    const { data: order, error: getError } = await SupabaseDB.getOrderById(orderId);
    
    if (getError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation if order is APPROVED or PAYMENT_PENDING
    // Cannot cancel if already PAID, PREPARING, READY, DELIVERED, or already CANCELLED
    const allowedStatuses = ['APPROVED', 'PAYMENT_PENDING'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot cancel order with status: ${order.status}. Only APPROVED or PAYMENT_PENDING orders can be cancelled.` 
        },
        { status: 400 }
      );
    }

    // Cancel the order
    const { data: cancelledOrder, error: cancelError } = await SupabaseDB.cancelOrder(
      orderId,
      cancellationReason.trim(),
      cancelledBy
    );

    if (cancelError) {
      console.error('Error cancelling order:', cancelError);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: cancelledOrder
    });

  } catch (error: any) {
    console.error('Error in order cancellation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while cancelling the order' },
      { status: 500 }
    );
  }
}

