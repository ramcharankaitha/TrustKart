import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({
        success: false,
        error: 'Environment variables not set',
        details: {
          url: supabaseUrl ? 'Set' : 'Missing',
          key: supabaseAnonKey ? 'Set' : 'Missing'
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('shops')
      .select('id')
      .limit(1);

    if (testError) {
      return Response.json({
        success: false,
        error: 'Database connection failed',
        details: {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        }
      });
    }

    // Test approved shops query
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, name, status')
      .eq('status', 'APPROVED');

    if (shopsError) {
      return Response.json({
        success: false,
        error: 'Approved shops query failed',
        details: {
          message: shopsError.message,
          details: shopsError.details,
          hint: shopsError.hint,
          code: shopsError.code
        }
      });
    }

    return Response.json({
      success: true,
      message: 'Database connection successful',
      data: {
        totalShops: testData?.length || 0,
        approvedShops: shops?.length || 0,
        shops: shops || []
      }
    });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: 'Unexpected error',
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}
