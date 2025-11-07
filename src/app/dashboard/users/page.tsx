'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real app, fetch from database
      const mockUsers: User[] = [
        {
          id: 'user_001',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'CUSTOMER',
          phone: '+1234567890',
          address: '123 Main St, City',
          is_active: true,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 'user_002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'CUSTOMER',
          phone: '+1234567891',
          address: '456 Oak Ave, City',
          is_active: true,
          created_at: '2024-01-20T14:45:00Z'
        },
        {
          id: 'user_003',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          role: 'SHOPKEEPER',
          phone: '+1234567892',
          address: '789 Pine Rd, City',
          is_active: false,
          created_at: '2024-01-10T09:15:00Z'
        },
        {
          id: 'user_004',
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          role: 'CUSTOMER',
          phone: '+1234567893',
          address: '321 Elm St, City',
          is_active: true,
          created_at: '2024-01-25T16:20:00Z'
        },
        {
          id: 'user_005',
          name: 'David Brown',
          email: 'david@example.com',
          role: 'SHOPKEEPER',
          phone: '+1234567894',
          address: '654 Maple Dr, City',
          is_active: true,
          created_at: '2024-01-18T11:30:00Z'
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      setLoading(true);
      // In real app, call API to block user
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: false } : user
      ));
      
      toast({
        title: "User Blocked",
        description: "User has been blocked successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      setLoading(true);
      // In real app, call API to unblock user
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: true } : user
      ));
      
      toast({
        title: "User Unblocked",
        description: "User has been unblocked successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock user",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Customer</Badge>;
      case 'SHOPKEEPER':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Shopkeeper</Badge>;
      case 'ADMIN':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Admin</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Blocked
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    blocked: users.filter(u => !u.is_active).length,
    customers: users.filter(u => u.role === 'CUSTOMER').length,
    shopkeepers: users.filter(u => u.role === 'SHOPKEEPER').length,
  };

  return (
    <div className="container mx-auto my-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        <p className="text-muted-foreground">View all users, Block/Unblock users</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shopkeepers</p>
                <p className="text-2xl font-bold text-green-600">{stats.shopkeepers}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterRole('all')}>
              All Roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('CUSTOMER')}>
              Customers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('SHOPKEEPER')}>
              Shopkeepers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('ADMIN')}>
              Admins
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">No users match your search criteria.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.is_active)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{user.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {user.is_active ? (
                        <Button 
                          onClick={() => handleBlockUser(user.id)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleUnblockUser(user.id)}
                          disabled={loading}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Unblock
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Send Email</DropdownMenuItem>
                          <DropdownMenuItem>View Orders</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
