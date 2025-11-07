'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Transaction {
  id: string;
  customer_name: string;
  customer_email: string;
  shop_name: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: 'card' | 'upi' | 'wallet' | 'cash';
  transaction_id: string;
  created_at: string;
  refund_amount?: number;
  refund_reason?: string;
}

interface RefundRequest {
  id: string;
  transaction_id: string;
  customer_name: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  order_id: string;
}

export default function PaymentsManagementPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds'>('transactions');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for transactions
      const mockTransactions: Transaction[] = [
        {
          id: 'txn_001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          shop_name: 'FreshMart',
          amount: 450,
          status: 'completed',
          payment_method: 'card',
          transaction_id: 'TXN123456789',
          created_at: '2024-01-25T10:30:00Z'
        },
        {
          id: 'txn_002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          shop_name: 'DairyDelight',
          amount: 280,
          status: 'pending',
          payment_method: 'upi',
          transaction_id: 'TXN123456790',
          created_at: '2024-01-25T09:15:00Z'
        },
        {
          id: 'txn_003',
          customer_name: 'Mike Johnson',
          customer_email: 'mike@example.com',
          shop_name: 'BakeryCorner',
          amount: 120,
          status: 'failed',
          payment_method: 'wallet',
          transaction_id: 'TXN123456791',
          created_at: '2024-01-25T08:45:00Z'
        },
        {
          id: 'txn_004',
          customer_name: 'Sarah Wilson',
          customer_email: 'sarah@example.com',
          shop_name: 'MeatMaster',
          amount: 650,
          status: 'refunded',
          payment_method: 'card',
          transaction_id: 'TXN123456792',
          created_at: '2024-01-24T16:20:00Z',
          refund_amount: 650,
          refund_reason: 'Product quality issue'
        }
      ];

      // Mock data for refund requests
      const mockRefundRequests: RefundRequest[] = [
        {
          id: 'refund_001',
          transaction_id: 'TXN123456793',
          customer_name: 'David Brown',
          amount: 180,
          reason: 'Wrong product delivered',
          status: 'pending',
          requested_at: '2024-01-25T14:30:00Z',
          order_id: 'order_005'
        },
        {
          id: 'refund_002',
          transaction_id: 'TXN123456794',
          customer_name: 'Lisa Davis',
          amount: 320,
          reason: 'Product damaged during delivery',
          status: 'approved',
          requested_at: '2024-01-24T11:20:00Z',
          order_id: 'order_006'
        },
        {
          id: 'refund_003',
          transaction_id: 'TXN123456795',
          customer_name: 'Tom Wilson',
          amount: 95,
          reason: 'Customer changed mind',
          status: 'rejected',
          requested_at: '2024-01-23T16:45:00Z',
          order_id: 'order_007'
        }
      ];

      setTransactions(mockTransactions);
      setRefundRequests(mockRefundRequests);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment data",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><TrendingDown className="h-3 w-3 mr-1" />Refunded</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">💳 Card</Badge>;
      case 'upi':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">📱 UPI</Badge>;
      case 'wallet':
        return <Badge variant="outline" className="bg-green-50 text-green-700">💰 Wallet</Badge>;
      case 'cash':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">💵 Cash</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleRefundAction = async (refundId: string, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      // In real app, call API to approve/reject refund
      setRefundRequests(prev => prev.map(refund => 
        refund.id === refundId ? { ...refund, status: action === 'approve' ? 'approved' : 'rejected' } : refund
      ));
      
      toast({
        title: `Refund ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Refund request has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} refund request`,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRefundRequests = refundRequests.filter(request => {
    const matchesSearch = request.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.order_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    failedTransactions: transactions.filter(t => t.status === 'failed').length,
    refundedTransactions: transactions.filter(t => t.status === 'refunded').length,
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalRefunds: transactions.filter(t => t.status === 'refunded').reduce((sum, t) => sum + (t.refund_amount || 0), 0),
    pendingRefundRequests: refundRequests.filter(r => r.status === 'pending').length,
    approvedRefundRequests: refundRequests.filter(r => r.status === 'approved').length,
    rejectedRefundRequests: refundRequests.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="container mx-auto my-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payments Management</h1>
        <p className="text-muted-foreground">All Transactions, Refund Requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold text-red-600">₹{stats.totalRefunds.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Refunds</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRefundRequests}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completedTransactions}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-xl font-bold text-red-600">{stats.failedTransactions}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-xl font-bold text-blue-600">{stats.refundedTransactions}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'transactions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('transactions')}
        >
          All Transactions
        </Button>
        <Button
          variant={activeTab === 'refunds' ? 'default' : 'outline'}
          onClick={() => setActiveTab('refunds')}
        >
          Refund Requests ({stats.pendingRefundRequests})
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'transactions' ? 'transactions' : 'refund requests'}...`}
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
              Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              All Status
            </DropdownMenuItem>
            {activeTab === 'transactions' ? (
              <>
                <DropdownMenuItem onClick={() => setFilterStatus('completed')}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('failed')}>Failed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('refunded')}>Refunded</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('approved')}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>Rejected</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Transactions List */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">No transactions match your search criteria.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTransactions.map(transaction => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{transaction.transaction_id}</h3>
                          {getStatusBadge(transaction.status)}
                          {getPaymentMethodBadge(transaction.payment_method)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{transaction.customer_name}</span>
                            <span className="text-muted-foreground">({transaction.customer_email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₹{transaction.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Shop: {transaction.shop_name}</span>
                          </div>
                        </div>
                        
                        {transaction.refund_amount && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-red-800">
                              <TrendingDown className="h-4 w-4" />
                              <span>Refunded: ₹{transaction.refund_amount}</span>
                              <span>•</span>
                              <span>Reason: {transaction.refund_reason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Customer Details</DropdownMenuItem>
                            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                            <DropdownMenuItem>Process Refund</DropdownMenuItem>
                            <DropdownMenuItem>Contact Customer</DropdownMenuItem>
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
      )}

      {/* Refund Requests List */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          {filteredRefundRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Refund Requests Found</h3>
              <p className="text-muted-foreground">No refund requests match your search criteria.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRefundRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Refund #{request.id}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{request.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₹{request.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Transaction: {request.transaction_id}</span>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-sm text-yellow-800">
                            <strong>Reason:</strong> {request.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              onClick={() => handleRefundAction(request.id, 'approve')}
                              disabled={loading}
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRefundAction(request.id, 'reject')}
                              disabled={loading}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
