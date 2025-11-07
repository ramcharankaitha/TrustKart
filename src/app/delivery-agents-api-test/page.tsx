'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function DeliveryAgentsTestPage() {
  const { toast } = useToast();
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadDeliveryAgents();
  }, []);

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Testing delivery agents API...');
      
      const response = await fetch('/api/delivery-agents');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        if (data.success && data.deliveryAgents) {
          console.log('✅ Successfully loaded delivery agents:', data.deliveryAgents.length);
          setDeliveryAgents(data.deliveryAgents);
          setApiStatus('success');
          toast({
            title: "Success",
            description: `Loaded ${data.deliveryAgents.length} delivery agents successfully`,
          });
        } else {
          console.error('❌ API returned error:', data.error);
          setApiStatus('error');
          toast({
            title: "Error",
            description: data.error || 'Failed to load delivery agents',
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        console.error('❌ HTTP Error:', errorData);
        setApiStatus('error');
        toast({
          title: "Error",
          description: errorData.error || 'Failed to load delivery agents',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Network Error:', error);
      setApiStatus('error');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Agents API Test</h1>
          <p className="text-muted-foreground">Testing the delivery agents loading functionality</p>
        </div>
        <Button onClick={loadDeliveryAgents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge 
              variant={apiStatus === 'success' ? 'default' : apiStatus === 'error' ? 'destructive' : 'secondary'}
              className={apiStatus === 'success' ? 'bg-green-100 text-green-800 border-green-200' : ''}
            >
              {apiStatus === 'success' && <CheckCircle className="h-4 w-4 mr-1" />}
              {apiStatus === 'error' && <XCircle className="h-4 w-4 mr-1" />}
              {apiStatus === 'idle' && <Clock className="h-4 w-4 mr-1" />}
              {apiStatus === 'idle' ? 'Not Tested' : apiStatus === 'success' ? 'Working' : 'Error'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {deliveryAgents.length} delivery agents found
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Agents List */}
      {deliveryAgents.length === 0 ? (
        <Card className="p-8 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Delivery Agents Found</h3>
          <p className="text-muted-foreground">
            {apiStatus === 'error' 
              ? 'There was an error loading delivery agents. Check the console for details.'
              : 'No delivery agents have been registered yet.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deliveryAgents.map(agent => (
            <Card key={agent.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Email:</strong> {agent.email}</p>
                        <p><strong>Phone:</strong> {agent.phone}</p>
                        <p><strong>Vehicle:</strong> {agent.vehicleType} - {agent.vehicleNumber}</p>
                      </div>
                      <div>
                        <p><strong>License:</strong> {agent.licenseNumber}</p>
                        <p><strong>Aadhaar:</strong> {agent.aadhaarNumber}</p>
                        <p><strong>Rating:</strong> {agent.rating}/5 ({agent.totalDeliveries} deliveries)</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>Address:</strong> {agent.address}
                      </p>
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
