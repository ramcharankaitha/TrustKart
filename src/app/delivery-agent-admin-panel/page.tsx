'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  FileText,
  FileImage,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

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

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size: number;
  file_type: string;
  is_verified: boolean;
  verification_notes?: string;
  uploaded_at: string;
}

export default function DeliveryAgentAdminPanel() {
  const { toast } = useToast();
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [agentToReject, setAgentToReject] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveryAgents();
  }, []);

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading delivery agents for admin review...');
      
      const response = await fetch('/api/delivery-agents');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        if (data.success && data.deliveryAgents) {
          console.log('✅ Loaded delivery agents:', data.deliveryAgents.length);
          setDeliveryAgents(data.deliveryAgents);
          
          // Load documents for each agent
          for (const agent of data.deliveryAgents) {
            await loadAgentDocuments(agent.id);
          }
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

  const loadAgentDocuments = async (agentId: string) => {
    try {
      const response = await fetch(`/api/delivery-agents/${agentId}/documents`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.documents) {
          setDocuments(prev => ({
            ...prev,
            [agentId]: data.documents
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading documents for agent ${agentId}:`, error);
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

  const handleRejectAgent = async (agentId: string, reason: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent rejected successfully",
        });
        setShowRejectModal(false);
        setRejectionReason('');
        setAgentToReject(null);
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

  const openRejectModal = (agentId: string) => {
    setAgentToReject(agentId);
    setShowRejectModal(true);
  };

  const viewDocuments = (agent: DeliveryAgent) => {
    setSelectedAgent(agent);
    setShowDocuments(true);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-600" />
            Delivery Agent Management
          </h1>
          <p className="text-muted-foreground">Review and manage delivery agent applications</p>
        </div>
        <Button onClick={loadDeliveryAgents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

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
          <p className="text-muted-foreground">
            {loading ? 'Loading delivery agents...' : 'No delivery agents have registered yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
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
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <span className="text-xs text-red-600">Reason: {agent.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocuments(agent)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Documents
                    </Button>
                    
                    {agent.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveAgent(agent.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openRejectModal(agent.id)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents Modal */}
      {showDocuments && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents - {selectedAgent.name}
                </CardTitle>
                <Button variant="outline" onClick={() => setShowDocuments(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents[selectedAgent.id] && documents[selectedAgent.id].length > 0 ? (
                <div className="grid gap-4">
                  {documents[selectedAgent.id].map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {doc.file_type.startsWith('image/') ? (
                            <FileImage className="h-8 w-8 text-blue-500" />
                          ) : (
                            <FileText className="h-8 w-8 text-red-500" />
                          )}
                          <div>
                            <h4 className="font-medium capitalize">
                              {doc.document_type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_name} • {formatFileSize(doc.file_size)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.is_verified ? "default" : "secondary"}>
                            {doc.is_verified ? "Verified" : "Pending"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      {doc.verification_notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <strong>Admin Notes:</strong> {doc.verification_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Reject Delivery Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setAgentToReject(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => agentToReject && handleRejectAgent(agentToReject, rejectionReason)}
                  disabled={!rejectionReason.trim() || loading}
                >
                  Reject Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
