import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

// Prisma client for direct database operations
export const prisma = new PrismaClient()

// Supabase client for API operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database connection utilities
export class DatabaseConnection {
  static async testPrismaConnection(): Promise<boolean> {
    try {
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Prisma connection successful')
      return true
    } catch (error) {
      console.error('❌ Prisma connection failed:', error)
      return false
    }
  }

  static async testSupabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1)
      if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
        console.error('❌ Supabase connection failed:', error)
        return false
      }
      console.log('✅ Supabase connection successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
  }

  static async testAllConnections(): Promise<void> {
    console.log('Testing database connections...')
    
    const prismaOk = await this.testPrismaConnection()
    const supabaseOk = await this.testSupabaseConnection()
    
    if (prismaOk && supabaseOk) {
      console.log('🎉 All database connections successful!')
    } else {
      console.log('⚠️ Some connections failed. Check your configuration.')
    }
  }
}

// Auto-test connections in development
if (process.env.NODE_ENV === 'development') {
  DatabaseConnection.testAllConnections()
}
