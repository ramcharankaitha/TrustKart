'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react'
import { SupabaseDB } from '@/lib/supabase-db'

export default function SupabaseTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { success, error } = await SupabaseDB.testConnection()
      
      if (success) {
        setResult({ message: '✅ Supabase connection successful!', success: true })
      } else {
        setError(`Connection failed: ${error?.message || 'Unknown error'}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testDataOperations = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Test getting users
      const { data: users, error: usersError } = await SupabaseDB.getAllUsers()
      
      if (usersError) {
        setError(`Failed to fetch users: ${usersError.message}`)
        return
      }

      // Test getting shops
      const { data: shops, error: shopsError } = await SupabaseDB.getAllShops()
      
      if (shopsError) {
        setError(`Failed to fetch shops: ${shopsError.message}`)
        return
      }

      setResult({
        message: '✅ Data operations successful!',
        success: true,
        data: {
          users: users?.length || 0,
          shops: shops?.length || 0
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Database Test
          </CardTitle>
          <CardDescription>
            Test your Supabase connection and database operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button 
              onClick={testDataOperations} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Data...
                </>
              ) : (
                'Test Data Operations'
              )}
            </Button>
          </div>

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <AlertDescription>
                  {result.message}
                  {result.data && (
                    <div className="mt-2 text-sm">
                      <p>Users: {result.data.users}</p>
                      <p>Shops: {result.data.shops}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <AlertDescription>
                Error: {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Supabase URL:</strong> https://ilzjrfbrqcmilmgauiva.supabase.co</p>
            <p><strong>Status:</strong> Using Supabase REST API (no direct PostgreSQL connection needed)</p>
            <p className="text-xs">
              This approach bypasses Prisma and uses Supabase's built-in API, which is more reliable and doesn't require direct database access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
