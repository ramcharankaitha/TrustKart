'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DeliveryAgentTestPage() {
  const { toast } = useToast();
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testAgent, setTestAgent] = useState({
    name: 'Test Delivery Agent',
    email: 'test.delivery@example.com',
    phone: '9876543210',
    vehicleType: 'bike',
    vehicleNumber: 'KA01AB1234',
    licenseNumber: 'DL123456789',
    aadhaarNumber: '123456789012',
    address: 'Test Address, Test City'
  });

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delivery-agents');
      if (response.ok) {
        const data = await response.json();
        setDeliveryAgents(data);
        toast({
          title: "Success",
          description: `Loaded ${data.length} delivery agents`,
        });
      } else {
        throw new Error('Failed to load delivery agents');
      }
    } catch (error) {
      console.error('Error loading delivery agents:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerTestAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delivery-agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testAgent),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test delivery agent registered successfully",
        });
        loadDeliveryAgents(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering test agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register test agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAgent = async (agentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent approved successfully",
        });
        loadDeliveryAgents(); // Refresh the list
      } else {
        throw new Error('Failed to approve agent');
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      toast({
        title: "Error",
        description: "Failed to approve delivery agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent rejected successfully",
        });
        loadDeliveryAgents(); // Refresh the list
      } else {
        throw new Error('Failed to reject agent');
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast({
        title: "Error",
        description: "Failed to reject delivery agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendAgent = async (agentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/suspend`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent suspended successfully",
        });
        loadDeliveryAgents(); // Refresh the list
      } else {
        throw new Error('Failed to suspend agent');
      }
    } catch (error) {
      console.error('Error suspending agent:', error);
      toast({
        title: "Error",
        description: "Failed to suspend delivery agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { variant: 'destructive' as const };
      case 'suspended':
        return { variant: 'outline' as const, className: 'border-orange-500 text-orange-600' };
      default:
        return { variant: 'secondary' as const };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto my-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Delivery Agent Test Page</h1>
        <p className="text-muted-foreground">Test delivery agent registration and management functionality</p>
      </div>

      {/* Test Registration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Register Test Delivery Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={testAgent.name}
                onChange={(e) => setTestAgent({ ...testAgent, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={testAgent.email}
                onChange={(e) => setTestAgent({ ...testAgent, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={testAgent.phone}
                onChange={(e) => setTestAgent({ ...testAgent, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={testAgent.vehicleType}
                onChange={(e) => setTestAgent({ ...testAgent, vehicleType: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={testAgent.vehicleNumber}
                onChange={(e) => setTestAgent({ ...testAgent, vehicleNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={testAgent.licenseNumber}
                onChange={(e) => setTestAgent({ ...testAgent, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                value={testAgent.aadhaarNumber}
                onChange={(e) => setTestAgent({ ...testAgent, aadhaarNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={testAgent.address}
                onChange={(e) => setTestAgent({ ...testAgent, address: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={registerTestAgent} disabled={loading}>
              Register Test Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Button onClick={loadDeliveryAgents} disabled={loading} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Load Delivery Agents
        </Button>
      </div>

      {/* Delivery Agents List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Delivery Agents ({deliveryAgents.length})</h2>
        
        {deliveryAgents.length === 0 ? (
          <Card className="p-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Delivery Agents Found</h3>
            <p className="text-muted-foreground">Click "Load Delivery Agents" to fetch data or register a test agent.</p>
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
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Email:</span> {agent.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {agent.phone}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle:</span> {agent.vehicleType?.toUpperCase() || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle Number:</span> {agent.vehicleNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">License:</span> {agent.licenseNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Aadhaar:</span> {agent.aadhaarNumber || 'Not provided'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Address:</span> {agent.address || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span> {agent.rating.toFixed(1)}/5.0
                        </div>
                        <div>
                          <span className="font-medium">Total Deliveries:</span> {agent.totalDeliveries}
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span> {new Date(agent.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {agent.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleApproveAgent(agent.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleRejectAgent(agent.id)}
                            disabled={loading}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {agent.status === 'approved' && (
                        <Button 
                          onClick={() => handleSuspendAgent(agent.id)}
                          disabled={loading}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      
                      {agent.status === 'suspended' && (
                        <Button 
                          onClick={() => handleApproveAgent(agent.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Re-approve
                        </Button>
                      )}
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