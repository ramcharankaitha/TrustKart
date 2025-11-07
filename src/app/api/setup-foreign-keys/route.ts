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
 * API endpoint to set up foreign key relationships
 * This will execute the FIX-ORDERS-USERS-RELATIONSHIP.sql script
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Read the SQL script
    const fs = require('fs');
    const path = require('path');
    
    const sqlScriptPath = path.join(process.cwd(), 'FIX-ORDERS-USERS-RELATIONSHIP.sql');
    
    let sqlScript: string;
    try {
      sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');
    } catch (error) {
      // If file not found, return the SQL as a response
      return NextResponse.json({
        success: false,
        error: 'SQL script file not found. Please run the SQL manually in Supabase SQL Editor.',
        sql: `-- Add foreign key constraint: orders.customer_id -> users.id
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customer_id 
FOREIGN KEY (customer_id) 
REFERENCES users(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Add foreign key constraint: orders.shop_id -> shops.id
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_shop_id 
FOREIGN KEY (shop_id) 
REFERENCES shops(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Add foreign key constraint: deliveries.order_id -> orders.id
ALTER TABLE deliveries 
ADD CONSTRAINT fk_deliveries_order_id 
FOREIGN KEY (order_id) 
REFERENCES orders(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Add foreign key constraint: deliveries.delivery_agent_id -> delivery_agents.id
ALTER TABLE deliveries 
ADD CONSTRAINT fk_deliveries_delivery_agent_id 
FOREIGN KEY (delivery_agent_id) 
REFERENCES delivery_agents(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;`
      }, { status: 404 });
    }

    // Split SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

    const results = [];
    
    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query execution (if RPC doesn't exist)
          // Note: Supabase client may not have direct SQL execution
          // This might need to be done via Supabase Dashboard SQL Editor
          console.error('Error executing SQL:', error);
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: error.message
          });
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true
          });
        }
      } catch (err: any) {
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key setup attempted. Some operations may need to be done manually via Supabase SQL Editor.',
      results,
      note: 'Please run the SQL script FIX-ORDERS-USERS-RELATIONSHIP.sql manually in Supabase SQL Editor for best results.'
    });

  } catch (error: any) {
    console.error('Error setting up foreign keys:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      note: 'Please run the SQL script FIX-ORDERS-USERS-RELATIONSHIP.sql manually in Supabase SQL Editor.'
    }, { status: 500 });
  }
}

