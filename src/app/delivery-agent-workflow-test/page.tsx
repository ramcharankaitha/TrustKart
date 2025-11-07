'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
  aadhaarNumber: string;
  address: string;
  status: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryAgentWorkflowTest() {
  const { toast } = useToast();
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeliveryAgents();
  }, []);

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Testing delivery agent workflow...');
      
      const response = await fetch('/api/delivery-agents');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        if (data.success && data.deliveryAgents) {
          console.log('✅ Loaded delivery agents:', data.deliveryAgents.length);
          setDeliveryAgents(data.deliveryAgents);
        } else {
          console.error('❌ API returned error:', data.error);
          toast({
            title: "Error",
            description: data.error || 'Failed to load delivery agents',
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load delivery agents');
      }
    } catch (error: any) {
      console.error('❌ Error loading delivery agents:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load delivery agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' };
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'rejected':
        return { variant: 'destructive' as const };
      case 'suspended':
        return { variant: 'outline' as const, className: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { variant: 'secondary' as const };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-600" />
            Delivery Agent Workflow Test
          </h1>
          <p className="text-muted-foreground">Complete workflow testing for delivery agent registration and approval</p>
        </div>
        <Button onClick={loadDeliveryAgents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complete Workflow Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">1. Registration</h3>
              <p className="text-sm text-muted-foreground mb-2">Agent fills form and uploads documents</p>
              <Link href="/delivery-agent-registration">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Test Registration
                </Button>
              </Link>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-1">2. Pending Review</h3>
              <p className="text-sm text-muted-foreground mb-2">Admin reviews application and documents</p>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {deliveryAgents.filter(agent => agent.status === 'pending').length} Pending
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">3. Approval</h3>
              <p className="text-sm text-muted-foreground mb-2">Admin approves or rejects with reason</p>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {deliveryAgents.filter(agent => agent.status === 'approved').length} Approved
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">4. Active</h3>
              <p className="text-sm text-muted-foreground mb-2">Agent can login and accept deliveries</p>
              <Link href="/delivery-agent-admin-panel">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {deliveryAgents.filter(agent => agent.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {deliveryAgents.filter(agent => agent.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {deliveryAgents.filter(agent => agent.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{deliveryAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Agents List */}
      {deliveryAgents.length === 0 ? (
        <Card className="p-8 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Delivery Agents Found</h3>
          <p className="text-muted-foreground mb-4">
            {loading ? 'Loading delivery agents...' : 'No delivery agents have registered yet.'}
          </p>
          <Link href="/delivery-agent-registration">
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Register First Agent
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">All Delivery Agents</h2>
            <Link href="/delivery-agent-admin-panel">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Open Admin Panel
              </Button>
            </Link>
          </div>
          
          {deliveryAgents.map(agent => (
            <Card key={agent.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{agent.name}</h3>
                      <Badge {...getStatusBadge(agent.status)}>
                        {getStatusIcon(agent.status)}
                        <span className="ml-1 capitalize">{agent.status}</span>
                      </Badge>
                      {agent.isAvailable && agent.status === 'approved' && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span>{agent.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span>{agent.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-slate-500" />
                          <span className="capitalize">{agent.vehicleType} - {agent.vehicleNumber}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span>License: {agent.licenseNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span>Aadhaar: {agent.aadhaarNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>Applied: {formatDate(agent.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                          <span className="text-xs">{agent.address}</span>
                        </div>
                        {agent.rejectionReason && (
                          <div className="p-2 bg-red-50 rounded text-xs text-red-600">
                            <strong>Rejection Reason:</strong> {agent.rejectionReason}
                          </div>
                        )}
                        {agent.reviewedAt && (
                          <div className="text-xs text-slate-500">
                            Reviewed: {formatDate(agent.reviewedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
