import { NextRequest, NextResponse } from 'next/server'
import { DatabaseConnection } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connections...')
    
    const prismaOk = await DatabaseConnection.testPrismaConnection()
    const supabaseOk = await DatabaseConnection.testSupabaseConnection()
    
    return NextResponse.json({
      success: true,
      connections: {
        prisma: prismaOk,
        supabase: supabaseOk,
        overall: prismaOk && supabaseOk
      },
      message: prismaOk && supabaseOk 
        ? 'All database connections successful!' 
        : 'Some connections failed. Check configuration.'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connections: {
        prisma: false,
        supabase: false,
        overall: false
      }
    }, { status: 500 })
  }
}
