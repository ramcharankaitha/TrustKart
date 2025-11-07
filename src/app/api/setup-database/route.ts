import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...');
    
    const results: any = {};

    // Test Prisma connection
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      results.prisma = 'Connected successfully';
      console.log('✅ Prisma connection successful');
    } catch (error) {
      results.prisma = `Connection failed: ${error}`;
      console.error('❌ Prisma connection failed:', error);
    }

    // Test Supabase connection
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      results.supabase = 'Connected successfully';
      console.log('✅ Supabase connection successful');
    } catch (error) {
      results.supabase = `Connection failed: ${error}`;
      console.error('❌ Supabase connection failed:', error);
    }

    // Try to create missing tables/columns
    try {
      // Check if users table exists and has required columns
      const userColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `;
      
      const columnNames = (userColumns as any[]).map(col => col.column_name);
      
      // Add missing columns if needed
      if (!columnNames.includes('password')) {
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN password VARCHAR(255)`;
        results.passwordColumn = 'Added password column';
      }
      
      if (!columnNames.includes('phone')) {
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`;
        results.phoneColumn = 'Added phone column';
      }
      
      if (!columnNames.includes('aadhaar_number')) {
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(12)`;
        results.aadhaarColumn = 'Added aadhaar_number column';
      }

      results.schemaUpdate = 'Schema updated successfully';
    } catch (error) {
      results.schemaUpdate = `Schema update failed: ${error}`;
      console.error('❌ Schema update failed:', error);
    }

    // Test basic operations
    try {
      const userCount = await prisma.user.count();
      results.userCount = `Found ${userCount} users`;
      
      const shopCount = await prisma.shop.count();
      results.shopCount = `Found ${shopCount} shops`;
      
      results.basicOperations = 'Basic operations working';
    } catch (error) {
      results.basicOperations = `Basic operations failed: ${error}`;
      console.error('❌ Basic operations failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      results
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: {}
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    // Test connections
    const results: any = {};

    // Test Prisma
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      results.prisma = true;
    } catch (error) {
      results.prisma = false;
      results.prismaError = error;
    }

    // Test Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      results.supabase = true;
    } catch (error) {
      results.supabase = false;
      results.supabaseError = error;
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
