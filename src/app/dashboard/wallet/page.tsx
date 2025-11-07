'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, History, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to view your wallet.",
        });
        router.push('/login');
        return;
      }

      // Fetch wallet balance and transactions
      const response = await fetch(`/api/wallet/balance?userId=${userSession.id}`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load wallet data",
        });
      }
    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load wallet data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
      });
      return;
    }

    if (parseFloat(amount) > 100000) {
      toast({
        variant: "destructive",
        title: "Amount Too Large",
        description: "Maximum amount per transaction is ₹1,00,000",
      });
      return;
    }

    try {
      setAddingMoney(true);
      
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to add money.",
        });
        return;
      }

      // Call API to add money
      const response = await fetch('/api/wallet/add-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userSession.id,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod,
          paymentReference: paymentReference || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Money Added Successfully",
          description: data.message || `₹${amount} has been added to your wallet.`,
        });
        
        // Reset form
        setAmount('');
        setPaymentReference('');
        setShowAddMoneyDialog(false);
        
        // Reload wallet data
        loadWalletData();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to add money. Please try again.",
        });
      }
    } catch (error: any) {
      console.error('Error adding money:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add money. Please try again.",
      });
    } finally {
      setAddingMoney(false);
    }
  };

  const quickAddAmount = (value: number) => {
    setAmount(value.toString());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'DEBIT':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'REFUND':
        return <ArrowDownCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-green-600';
      case 'DEBIT':
        return 'text-red-600';
      case 'REFUND':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">E-Wallet</h1>
        <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Money
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Add funds to your wallet for quick and easy payments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="100000"
                  step="0.01"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddAmount(100)}
                  >
                    ₹100
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddAmount(500)}
                  >
                    ₹500
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddAmount(1000)}
                  >
                    ₹1,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddAmount(2000)}
                  >
                    ₹2,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddAmount(5000)}
                  >
                    ₹5,000
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                    <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                <Input
                  id="payment-reference"
                  type="text"
                  placeholder="Transaction ID, UPI reference, etc."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddMoney}
                disabled={addingMoney || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                {addingMoney ? 'Adding...' : `Add ₹${amount || '0'}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
            <CardDescription>Your current available balance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading...</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                  <IndianRupee className="h-8 w-8" />
                  {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.description || transaction.transaction_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'CREDIT' || transaction.transaction_type === 'REFUND' ? '+' : '-'}
                        ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Complete history of all your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Transactions</h3>
              <p className="text-muted-foreground mb-4">
                Your wallet transaction history will appear here once you start adding money or making payments.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'CREDIT' || transaction.transaction_type === 'REFUND'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.description || transaction.transaction_type}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                        {transaction.payment_method && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method}
                            </Badge>
                          </>
                        )}
                        {transaction.payment_reference && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">
                              Ref: {transaction.payment_reference.substring(0, 8)}...
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                      {transaction.transaction_type === 'CREDIT' || transaction.transaction_type === 'REFUND' ? '+' : '-'}
                      ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: ₹{transaction.balance_after.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <Badge
                      variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
