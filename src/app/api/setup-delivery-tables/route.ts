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
    const supabase = getSupabaseClient();

    // Create delivery_agents table
    const createDeliveryAgentsTable = `
      CREATE TABLE IF NOT EXISTS delivery_agents (
        id TEXT PRIMARY KEY DEFAULT 'agent_' || substr(md5(random()::text), 1, 8),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        vehicle_type TEXT,
        vehicle_number TEXT,
        license_number TEXT,
        aadhaar_number TEXT,
        address TEXT,
        status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
        is_available BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0,
        total_deliveries INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create deliveries table
    const createDeliveriesTable = `
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY DEFAULT 'delivery_' || substr(md5(random()::text), 1, 8),
        order_id TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        delivery_agent_id TEXT REFERENCES delivery_agents(id),
        status TEXT DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED')),
        assigned_at TIMESTAMP WITH TIME ZONE,
        picked_up_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        delivery_address TEXT NOT NULL,
        delivery_phone TEXT,
        notes TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
      CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(status);
      CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
      CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
    `;

    // Execute table creation
    const { error: agentsError } = await supabase.rpc('exec_sql', { sql: createDeliveryAgentsTable });
    if (agentsError) {
      console.error('Error creating delivery_agents table:', agentsError);
      return NextResponse.json({
        success: false,
        error: `Failed to create delivery_agents table: ${agentsError.message}`
      }, { status: 500 });
    }

    const { error: deliveriesError } = await supabase.rpc('exec_sql', { sql: createDeliveriesTable });
    if (deliveriesError) {
      console.error('Error creating deliveries table:', deliveriesError);
      return NextResponse.json({
        success: false,
        error: `Failed to create deliveries table: ${deliveriesError.message}`
      }, { status: 500 });
    }

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexes });
    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
      // Don't fail the whole operation for index errors
    }

    // Test the tables by trying to query them
    const { data: agentsTest, error: agentsTestError } = await supabase
      .from('delivery_agents')
      .select('count')
      .limit(1);

    const { data: deliveriesTest, error: deliveriesTestError } = await supabase
      .from('deliveries')
      .select('count')
      .limit(1);

    if (agentsTestError || deliveriesTestError) {
      return NextResponse.json({
        success: false,
        error: 'Tables created but not accessible. Check database permissions.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery agent tables created successfully!',
      tables: {
        delivery_agents: 'Created',
        deliveries: 'Created',
        indexes: 'Created'
      }
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred during database setup'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Check if tables exist
    const { data: agentsCheck, error: agentsError } = await supabase
      .from('delivery_agents')
      .select('count')
      .limit(1);

    const { data: deliveriesCheck, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('count')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: {
        delivery_agents: agentsError ? 'Not found' : 'Exists',
        deliveries: deliveriesError ? 'Not found' : 'Exists'
      },
      errors: {
        delivery_agents: agentsError?.message,
        deliveries: deliveriesError?.message
      }
    });

  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
