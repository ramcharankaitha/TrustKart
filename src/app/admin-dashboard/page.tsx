'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Store, RefreshCw, Database } from 'lucide-react'
import { SupabaseDB } from '@/lib/supabase-db'

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

interface Shop {
  id: string
  name: string
  description: string
  address: string
  status: string
  owner_id: string
  created_at: string
  users?: {
    name: string
    email: string
  }
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [shops, setShops] = useState<Shop[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await SupabaseDB.getAllUsers()
      if (usersError) throw usersError

      // Fetch shops with owner details
      const { data: shopsData, error: shopsError } = await SupabaseDB.getAllShops()
      if (shopsError) throw shopsError

      setUsers(usersData || [])
      setShops(shopsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'SHOPKEEPER': return 'bg-blue-100 text-blue-800'
      case 'CUSTOMER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Admin Dashboard - All Registrations
          </CardTitle>
          <CardDescription>
            View all customer and shopkeeper registrations stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>
                Error: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Users Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Users ({users.length})</h3>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{user.name || 'No name'}</h4>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Registered: {formatDate(user.created_at)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Shops Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Shops ({shops.length})</h3>
            </div>

            {shops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No shops registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shops.map((shop) => (
                  <Card key={shop.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{shop.name}</h4>
                        <Badge className={getStatusBadgeColor(shop.status)}>
                          {shop.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{shop.description}</p>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                      {shop.users && (
                        <p className="text-sm text-gray-500">
                          Owner: {shop.users.name} ({shop.users.email})
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(shop.created_at)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Database Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Users</p>
                <p className="font-semibold">{users.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Customers</p>
                <p className="font-semibold">{users.filter(u => u.role === 'CUSTOMER').length}</p>
              </div>
              <div>
                <p className="text-gray-600">Shopkeepers</p>
                <p className="font-semibold">{users.filter(u => u.role === 'SHOPKEEPER').length}</p>
              </div>
              <div>
                <p className="text-gray-600">Shops</p>
                <p className="font-semibold">{shops.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
