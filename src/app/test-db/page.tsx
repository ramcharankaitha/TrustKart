'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ConnectionStatus {
  prisma: boolean
  supabase: boolean
  overall: boolean
}

export default function DatabaseTestPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()

      if (data.success) {
        setStatus(data.connections)
      } else {
        setError(data.error || 'Connection test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>
            Test the connection to your Supabase PostgreSQL database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Database Connection'
            )}
          </Button>

          {status && (
            <div className="space-y-2">
              <Alert className={status.overall ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center">
                  {status.overall ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <AlertDescription>
                    {status.overall ? 'All connections successful!' : 'Some connections failed'}
                  </AlertDescription>
                </div>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  {status.prisma ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">Prisma ORM</span>
                </div>
                <div className="flex items-center space-x-2">
                  {status.supabase ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">Supabase Client</span>
                </div>
              </div>
            </div>
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
            <p><strong>Database URL:</strong> postgresql://postgres:***@db.ilzjrfbrqcmilmgauiva.supabase.co:5432/postgres</p>
            <p><strong>Supabase URL:</strong> https://ilzjrfbrqcmilmgauiva.supabase.co</p>
            <p className="text-xs">
              Make sure your <code>.env</code> file contains the correct Supabase keys.
              See <code>SUPABASE_SETUP.md</code> for detailed setup instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
