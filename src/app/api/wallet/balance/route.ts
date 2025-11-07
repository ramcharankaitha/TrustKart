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

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get or create wallet balance
    let { data: wallet, error: walletError } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If wallet doesn't exist, create it with 0 balance
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
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json({
        success: false,
        error: walletError.message || 'Failed to fetch wallet balance'
      }, { status: 500 });
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      // Don't fail if transactions can't be fetched, just return empty array
    }

    return NextResponse.json({
      success: true,
      balance: parseFloat(wallet.balance) || 0,
      transactions: transactions || []
    });
  } catch (error: any) {
    console.error('Error in wallet balance API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

