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
    const body = await request.json();
    const { userId, amount, paymentMethod = 'UPI', paymentReference } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0'
      }, { status: 400 });
    }

    if (amount > 100000) {
      return NextResponse.json({
        success: false,
        error: 'Maximum amount per transaction is ₹1,00,000'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Start transaction: Get current balance
    let { data: wallet, error: walletError } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    let balanceBefore = 0;
    let walletId = null;

    // If wallet doesn't exist, create it
    if (walletError && walletError.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('wallet_balances')
        .insert([{
          user_id: userId,
          balance: 0.00
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create wallet'
        }, { status: 500 });
      }

      wallet = newWallet;
      balanceBefore = 0;
      walletId = newWallet.id;
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json({
        success: false,
        error: walletError.message || 'Failed to fetch wallet balance'
      }, { status: 500 });
    } else {
      balanceBefore = parseFloat(wallet.balance) || 0;
      walletId = wallet.id;
    }

    // Calculate new balance
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallet_balances')
      .update({
        balance: balanceAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update wallet balance'
      }, { status: 500 });
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: userId,
        transaction_type: 'CREDIT',
        amount: parseFloat(amount),
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Added ₹${amount} to wallet`,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        status: 'COMPLETED'
      }])
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Transaction record failed, but balance was updated
      // In production, you might want to rollback the balance update
      // For now, we'll continue but log the error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ₹${amount} to wallet`,
      balance: parseFloat(updatedWallet.balance),
      transaction: transaction || null
    });
  } catch (error: any) {
    console.error('Error in add money API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

