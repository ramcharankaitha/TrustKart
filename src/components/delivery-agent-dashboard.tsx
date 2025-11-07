'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package, 
  Star,
  Phone,
  Navigation,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Calendar,
  TrendingUp,
  User,
  X,
  Check,
  ArrowRight,
  MessageCircle,
  Wallet,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geocodeAddress } from '@/lib/geocoding-service';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Delivery {
  id: string;
  status: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  delivery_address: string;
  delivery_phone?: string;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_photo_url?: string;
  delivery_photo_uploaded_at?: string;
  notes?: string;
  order: {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    customer_latitude?: number;
    customer_longitude?: number;
    shop_latitude?: number;
    shop_longitude?: number;
    customer: {
      name: string;
      phone: string;
      address?: string;
    };
    shop: {
      name: string;
      address: string;
      phone: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
}

interface Earnings {
  today: number;
  weekly: number;
  monthly: number;
  total: number;
}

export default function DeliveryAgentDashboard() {
  const [deliveryAgent, setDeliveryAgent] = useState<DeliveryAgent | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [newOrders, setNewOrders] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, weekly: 0, monthly: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'history'>('home');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedDeliveryForPhoto, setSelectedDeliveryForPhoto] = useState<Delivery | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load delivery agent data immediately on mount
    if (typeof window !== 'undefined') {
      // Try immediate load
      loadDeliveryAgentData();
      
      // Also try after a short delay (in case redirect just happened and sessionStorage wasn't ready)
      const timeout = setTimeout(() => {
        if (!deliveryAgent) {
          console.log('🔄 Retrying to load delivery agent data after delay...');
          loadDeliveryAgentData();
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (deliveryAgent?.id) {
      console.log('✅ Delivery agent ID found, loading data:', deliveryAgent.id);
      console.log('📍 Agent availability:', deliveryAgent.isAvailable);
      setLoading(false); // Set loading to false once agent is loaded
      setDataLoading(true);
      
      // Get current location for navigation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            setCurrentLocation(newLocation);
            // Store in localStorage for later use
            localStorage.setItem('delivery_agent_location', JSON.stringify({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              timestamp: Date.now()
            }));
            console.log('✅ Current location obtained:', {
              lat: newLocation.latitude,
              lng: newLocation.longitude
            });

            // Update location in database immediately
            if (deliveryAgent.id) {
              try {
                const response = await fetch(`/api/delivery-agents/${deliveryAgent.id}/location`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    latitude: newLocation.latitude,
                    longitude: newLocation.longitude
                  })
                });

                if (response.ok) {
                  console.log('✅ Initial location updated in database');
                }
              } catch (error) {
                console.error('Error updating initial location in database:', error);
              }
            }
          },
          (error) => {
            console.warn('Could not get current location:', error);
            // Try to get from localStorage
            try {
              const stored = localStorage.getItem('delivery_agent_location');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.latitude && parsed.longitude) {
                  setCurrentLocation({
                    latitude: parsed.latitude,
                    longitude: parsed.longitude
                  });
                }
              }
            } catch (e) {
              console.error('Error reading stored location:', e);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
        
        // Watch position for updates
        const watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            setCurrentLocation(newLocation);
            localStorage.setItem('delivery_agent_location', JSON.stringify({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              timestamp: Date.now()
            }));

            // Update location in database so customers can track
            if (deliveryAgent.id) {
              try {
                const response = await fetch(`/api/delivery-agents/${deliveryAgent.id}/location`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    latitude: newLocation.latitude,
                    longitude: newLocation.longitude
                  })
                });

                if (response.ok) {
                  console.log('✅ Location updated in database');
                } else {
                  console.warn('⚠️ Failed to update location in database');
                }
              } catch (error) {
                console.error('Error updating location in database:', error);
              }
            }
          },
          (error) => {
            console.warn('Error watching position:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute
          }
        );
        
        Promise.all([
          loadDeliveries(),
          loadEarnings(),
          loadNewOrders()
        ]).finally(() => {
          setDataLoading(false);
          console.log('✅ All data loaded successfully');
        });
        
        // Set up polling for deliveries and new orders every 5 seconds
        const interval = setInterval(() => {
          console.log('🔄 Polling for deliveries and new orders...');
          loadDeliveries(); // Refresh assigned deliveries
          if (deliveryAgent.isAvailable) {
            loadNewOrders(); // Refresh unassigned deliveries
          }
        }, 5000); // Poll every 5 seconds for faster updates
        
        return () => {
          clearInterval(interval);
          navigator.geolocation.clearWatch(watchId);
        };
      } else {
        // Geolocation not available, just load data
        Promise.all([
          loadDeliveries(),
          loadEarnings(),
          loadNewOrders()
        ]).finally(() => {
          setDataLoading(false);
          console.log('✅ All data loaded successfully');
        });
        
        // Set up polling for deliveries and new orders
        const interval = setInterval(() => {
          console.log('🔄 Polling for deliveries and new orders...');
          loadDeliveries(); // Refresh assigned deliveries
          if (deliveryAgent.isAvailable) {
            loadNewOrders(); // Refresh unassigned deliveries
          }
        }, 5000);
        
        return () => clearInterval(interval);
      }
    } else if (deliveryAgent === null && initialized) {
      // If we've checked and no agent found, stop loading
      console.warn('⚠️ No delivery agent found after initial check');
      setLoading(false);
    }
  }, [deliveryAgent?.id, deliveryAgent?.isAvailable]);

  const loadDeliveryAgentData = () => {
    try {
      const sessionData = sessionStorage.getItem('deliveryAgentSession');
      console.log('🔍 Checking sessionStorage for deliveryAgentSession:', sessionData ? '✅ Found' : '❌ Not found');
      
      if (sessionData) {
        try {
          const agent = JSON.parse(sessionData);
          console.log('✅ Delivery agent loaded successfully:', {
            name: agent.name,
            id: agent.id,
            email: agent.email,
            isAvailable: agent.isAvailable
          });
          
          // Ensure all required fields are present
          if (agent.id && agent.name && agent.email) {
            setDeliveryAgent({
              id: agent.id,
              name: agent.name,
              email: agent.email,
              phone: agent.phone || '',
              vehicleType: agent.vehicleType || agent.vehicle_type || 'bike',
              status: agent.status || 'APPROVED',
              isAvailable: agent.isAvailable !== undefined ? agent.isAvailable : false,
              rating: agent.rating || 0,
              totalDeliveries: agent.totalDeliveries || agent.total_deliveries || 0
            });
            setLoading(false);
            setInitialized(true);
          } else {
            console.error('❌ Invalid delivery agent data - missing required fields');
            setDeliveryAgent(null);
            setLoading(false);
            setInitialized(true);
          }
        } catch (parseError) {
          console.error('❌ Error parsing session data:', parseError);
          setDeliveryAgent(null);
          setLoading(false);
          setInitialized(true);
        }
      } else {
        // No session found
        console.warn('⚠️ No delivery agent session found in sessionStorage');
        setDeliveryAgent(null);
        setLoading(false);
        setInitialized(true);
      }
    } catch (error) {
      console.error('❌ Error loading delivery agent data:', error);
      setDeliveryAgent(null);
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadDeliveries = async () => {
    if (!deliveryAgent?.id) {
      console.log('⚠️ Cannot load deliveries: No delivery agent ID');
      return;
    }
    
    try {
      console.log('🔍 Loading assigned deliveries for agent:', deliveryAgent.id);
      const response = await fetch(`/api/deliveries?deliveryAgentId=${deliveryAgent.id}`);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch deliveries:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Loaded deliveries:', {
          total: result.deliveries?.length || 0,
          deliveries: result.deliveries?.map((d: any) => ({
            id: d.id,
            status: d.status,
            order_id: d.order_id
          }))
        });
        
        // Filter to get active deliveries and remove null orders
        const activeDeliveriesList = (result.deliveries || []).filter(
          (d: Delivery) => 
            ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status) &&
            d.order !== null &&
            d.order !== undefined
        );
        
        // Log any deliveries with null orders for debugging
        const nullOrderDeliveries = (result.deliveries || []).filter(
          (d: any) => d.order === null || d.order === undefined
        );
        if (nullOrderDeliveries.length > 0) {
          console.warn('⚠️ Found deliveries with null orders:', nullOrderDeliveries.map((d: any) => d.id));
        }
        
        console.log('✅ Active deliveries:', activeDeliveriesList.length);
        setDeliveries(activeDeliveriesList);
      } else {
        console.error('❌ Failed to load deliveries:', result.error);
        setDeliveries([]);
      }
    } catch (error) {
      console.error('❌ Error loading deliveries:', error);
      setDeliveries([]);
    }
  };

  const loadNewOrders = async () => {
    if (!deliveryAgent?.id) {
      console.log('⚠️ Cannot load new orders: No delivery agent ID');
      setNewOrders([]);
      return;
    }
    
    // Only load new orders if agent is available
    // This prevents unnecessary API calls when agent is offline
    if (!deliveryAgent.isAvailable) {
      console.log('⚠️ Agent not available, skipping new orders load');
      setNewOrders([]);
      return;
    }
    
    try {
      console.log('🔍 Loading new orders (unassigned deliveries)...');
      // Fetch unassigned deliveries directly using query parameter
      const url = `/api/deliveries?unassignedOnly=true`;
      console.log('🔍 Fetching unassigned deliveries from URL:', url);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }).catch((fetchError) => {
        clearTimeout(timeoutId);
        console.error('❌ Fetch error details:', {
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack,
          url: url,
          isAbortError: fetchError.name === 'AbortError'
        });
        throw fetchError;
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ API response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json().catch((jsonError) => {
        console.error('❌ JSON parse error:', jsonError);
        throw new Error('Failed to parse API response');
      });
      
      console.log('📦 Deliveries API response (unassigned only):', {
        success: result.success,
        totalDeliveries: result.deliveries?.length || 0,
        deliveries: result.deliveries?.map((d: any) => ({
          id: d.id,
          status: d.status,
          delivery_agent_id: d.delivery_agent_id,
          order_id: d.order_id,
          hasPickupLocation: !!(d.pickup_latitude && d.pickup_longitude),
          hasDeliveryLocation: !!(d.delivery_latitude && d.delivery_longitude)
        }))
      });
      
      if (result.success) {
        const unassignedDeliveries = result.deliveries || [];
        
        console.log('✅ Unassigned deliveries found:', unassignedDeliveries.length);
        if (unassignedDeliveries.length > 0) {
          console.log('📋 Unassigned delivery details:', unassignedDeliveries.map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            status: d.status,
            delivery_agent_id: d.delivery_agent_id,
            pickupAddress: d.pickup_address,
            deliveryAddress: d.delivery_address
          })));
        }
        
        // Filter out deliveries with null orders
        const validDeliveries = unassignedDeliveries.filter(
          (d: Delivery) => d.order !== null && d.order !== undefined
        );
        
        if (validDeliveries.length !== unassignedDeliveries.length) {
          console.warn('⚠️ Filtered out deliveries with null orders:', 
            unassignedDeliveries.length - validDeliveries.length);
        }
        
        setNewOrders(validDeliveries);
      } else {
        console.error('❌ Failed to load deliveries:', result.error);
        setNewOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading new orders:', {
        error: error,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        cause: error?.cause
      });
      // Don't set empty array on network errors - keep previous data
      // Only set empty if it's a clear API error
      if (error?.message?.includes('API request failed') || error?.message?.includes('parse')) {
        setNewOrders([]);
      }
    }
  };

  const loadEarnings = async () => {
    if (!deliveryAgent?.id) return;
    
    try {
      // Calculate earnings based on completed deliveries
      const response = await fetch(`/api/deliveries?deliveryAgentId=${deliveryAgent.id}&status=DELIVERED`);
      const result = await response.json();
      
      if (result.success) {
        const completedDeliveries = result.deliveries || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEarnings = completedDeliveries
          .filter((d: Delivery) => {
            const deliveredAt = d.delivered_at ? new Date(d.delivered_at) : null;
            return deliveredAt && deliveredAt >= today;
          })
          .reduce((sum: number, d: Delivery) => sum + (d.order?.total_amount || 0) * 0.1, 0); // 10% commission
        
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const weeklyEarnings = completedDeliveries
          .filter((d: Delivery) => {
            const deliveredAt = d.delivered_at ? new Date(d.delivered_at) : null;
            return deliveredAt && deliveredAt >= weekStart;
          })
          .reduce((sum: number, d: Delivery) => sum + (d.order?.total_amount || 0) * 0.1, 0);
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthlyEarnings = completedDeliveries
          .filter((d: Delivery) => {
            const deliveredAt = d.delivered_at ? new Date(d.delivered_at) : null;
            return deliveredAt && deliveredAt >= monthStart;
          })
          .reduce((sum: number, d: Delivery) => sum + (d.order?.total_amount || 0) * 0.1, 0);
        
        const totalEarnings = completedDeliveries
          .reduce((sum: number, d: Delivery) => sum + (d.order?.total_amount || 0) * 0.1, 0);
        
        setEarnings({
          today: todayEarnings,
          weekly: weeklyEarnings,
          monthly: monthlyEarnings,
          total: totalEarnings
        });
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const acceptOrder = async (deliveryId: string) => {
    if (!deliveryAgent?.id) return;
    
    try {
      const response = await fetch('/api/deliveries/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          deliveryAgentId: deliveryAgent.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Order Accepted ✅",
          description: "You've successfully accepted this order. It will appear in your Active Deliveries.",
        });
        // Immediately refresh both lists
        await Promise.all([
          loadDeliveries(),
          loadNewOrders()
        ]);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to accept order",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept order",
      });
    }
  };

  const rejectOrder = async (deliveryId: string) => {
    try {
      // Remove from new orders
      setNewOrders(prev => prev.filter(d => d.id !== deliveryId));
      toast({
        title: "Order Rejected",
        description: "Order has been removed from your list",
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string, photoUrl?: string) => {
    try {
      setUpdatingStatus(deliveryId);
      
      const response = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryId, 
          status,
          delivery_photo_url: photoUrl
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Delivery status updated to ${status}`,
        });
        loadDeliveries();
        if (status === 'DELIVERED') {
          loadEarnings();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update status",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const uploadDeliveryPhoto = async () => {
    if (!selectedDeliveryForPhoto || !photoFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a photo",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('deliveryId', selectedDeliveryForPhoto.id);
      formData.append('photo', photoFile);

      const response = await fetch('/api/deliveries/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Photo Uploaded ✅",
          description: "Delivery proof photo uploaded successfully",
        });
        
        // Update delivery status to DELIVERED with photo URL
        await updateDeliveryStatus(selectedDeliveryForPhoto.id, 'DELIVERED', result.photoUrl);
        
        // Close dialog and reset
        setShowPhotoUpload(false);
        setSelectedDeliveryForPhoto(null);
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Failed to upload photo",
        });
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload photo",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPhotoUploadDialog = (delivery: Delivery) => {
    setSelectedDeliveryForPhoto(delivery);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsCameraActive(false);
    setShowPhotoUpload(true);
  };

  const startCamera = async () => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext || 
                              window.location.protocol === 'https:' || 
                              window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        toast({
          variant: "default",
          title: "Camera Requires Secure Connection",
          description: "Camera access requires HTTPS. Please use the 'Upload Photo' button to select an image from your device instead.",
        });
        return;
      }

      // Check if getUserMedia is supported
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Check for legacy browser support
        const legacyGetUserMedia = (navigator as any).getUserMedia || 
                                   (navigator as any).webkitGetUserMedia || 
                                   (navigator as any).mozGetUserMedia ||
                                   (navigator as any).msGetUserMedia;
        
        if (!legacyGetUserMedia) {
          toast({
            variant: "default",
            title: "Camera Not Available",
            description: "Camera API is not supported in this browser. Please use the 'Upload Photo' button to select an image from your device.",
          });
          return;
        }

        // Use legacy API with callback style
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia.call(
            navigator,
            { video: { facingMode: 'environment' } },
            resolve,
            reject
          );
        });

        cameraStreamRef.current = stream;
        setCameraStream(stream);
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        return;
      }

      // Modern browser API (preferred)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      
      // Don't show error if user denied permission - just suggest file upload
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
          variant: "default",
          title: "Camera Permission Denied",
          description: "Please use the 'Upload Photo' button to select an image from your device instead.",
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast({
          variant: "default",
          title: "No Camera Found",
          description: "No camera device found. Please use the 'Upload Photo' button to select an image from your device.",
        });
      } else {
        toast({
          variant: "default",
          title: "Camera Not Available",
          description: error.message || "Please use the 'Upload Photo' button to select an image from your device instead.",
        });
      }
      
      setIsCameraActive(false);
      cameraStreamRef.current = null;
    }
  };

  const stopCamera = () => {
    const stream = cameraStreamRef.current || cameraStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
    setIsCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    const stream = cameraStreamRef.current;
    if (!videoRef.current || !stream || !isCameraActive) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `delivery-photo-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });
            handlePhotoSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
      });
    }
  };

  // Cleanup camera stream when dialog closes or component unmounts
  useEffect(() => {
    if (!showPhotoUpload && isCameraActive) {
      stopCamera();
    }
    
    return () => {
      const stream = cameraStreamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
        setCameraStream(null);
      }
    };
  }, [showPhotoUpload, isCameraActive]);

  const toggleAvailability = async () => {
    if (!deliveryAgent) return;
    
    try {
      const newAvailability = !deliveryAgent.isAvailable;
      const response = await fetch('/api/delivery-agents/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAgentId: deliveryAgent.id,
          isAvailable: newAvailability,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedAgent = { ...deliveryAgent, isAvailable: newAvailability };
        setDeliveryAgent(updatedAgent);
        
        toast({
          title: "Status Updated ✅",
          description: `You are now ${newAvailability ? 'online' : 'offline'}`,
        });
        
        // Refresh data when going online
        if (newAvailability) {
          console.log('🔄 Agent went online, refreshing deliveries and new orders...');
          await Promise.all([
            loadDeliveries(),
            loadNewOrders()
          ]);
        } else {
          // Clear new orders when going offline
          setNewOrders([]);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update availability",
        });
      }
    } catch (error) {
      console.error('❌ Error toggling availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      });
    }
  };

  const openNavigation = (destinationLat: number, destinationLng: number, originLat?: number, originLng?: number, useCurrentLocation: boolean = true) => {
    // Get delivery agent's current location
    let agentLat = originLat;
    let agentLng = originLng;
    
    // Use current location if available and useCurrentLocation is true
    if (useCurrentLocation && currentLocation) {
      agentLat = currentLocation.latitude;
      agentLng = currentLocation.longitude;
    } else if (useCurrentLocation && !agentLat && !agentLng) {
      // Fallback to localStorage
      try {
        const storedLocation = localStorage.getItem('delivery_agent_location');
        if (storedLocation) {
          const parsed = JSON.parse(storedLocation);
          if (parsed.latitude && parsed.longitude) {
            agentLat = parsed.latitude;
            agentLng = parsed.longitude;
          } else if (parsed.data && parsed.data.coordinates) {
            agentLat = parsed.data.coordinates.latitude;
            agentLng = parsed.data.coordinates.longitude;
          }
        }
      } catch (error) {
        console.error('Error getting delivery agent location:', error);
      }
    }

    // Build Google Maps directions URL
    let url = `https://www.google.com/maps/dir/?api=1`;
    
    // Add origin if we have agent location
    if (agentLat && agentLng) {
      url += `&origin=${agentLat},${agentLng}`;
    }
    
    // Add destination
    url += `&destination=${destinationLat},${destinationLng}`;
    
    // Open in new tab
    window.open(url, '_blank');
  };

  const callNumber = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Debug logging to help diagnose issues
  console.log('🎯 DeliveryAgentDashboard render:', {
    loading,
    initialized,
    hasDeliveryAgent: !!deliveryAgent,
    deliveryAgentId: deliveryAgent?.id,
    deliveryAgentName: deliveryAgent?.name,
    sessionCheck: typeof window !== 'undefined' ? (sessionStorage.getItem('deliveryAgentSession') ? 'EXISTS' : 'MISSING') : 'N/A'
  });

  // Show loading screen only while checking session initially
  if (loading && !initialized) {
    console.log('⏳ Rendering initial loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">Loading Dashboard...</div>
          <p className="text-sm text-slate-500">Please wait...</p>
        </div>
      </div>
    );
  }

  // Show error if no agent found after checking
  if (!deliveryAgent && initialized) {
    console.warn('❌ No delivery agent found after initialization');
    const hasSession = typeof window !== 'undefined' ? !!sessionStorage.getItem('deliveryAgentSession') : false;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">Please log in as a delivery agent</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasSession 
              ? 'Session found but could not load agent data. Please refresh the page.'
              : 'No delivery agent session found. Please log in again.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Go to Login
            </Button>
            {hasSession && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If still loading but initialized, show a different message (might be loading data)
  if (loading && initialized && !deliveryAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">Setting up your dashboard...</div>
        </div>
      </div>
    );
  }

  // Must have deliveryAgent at this point
  if (!deliveryAgent) {
    return null;
  }

  console.log('✅ Rendering dashboard for delivery agent:', deliveryAgent.name);

  const activeDeliveries = deliveries.filter(d => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Bar - Earnings & Online Toggle */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          {/* Today's Earnings - Swiggy Style */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 mb-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Today's Earnings</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('earnings')}
                className="text-white hover:bg-white/20"
              >
                View All
              </Button>
            </div>
            <div className="text-3xl font-bold">₹{earnings.today.toFixed(2)}</div>
            <div className="text-sm opacity-80 mt-1">
              {activeDeliveries.length} active delivery{activeDeliveries.length !== 1 ? 'ies' : ''}
            </div>
          </div>

          {/* Online/Offline Toggle - Large Button */}
          <Button
            onClick={toggleAvailability}
            className={`w-full h-14 text-lg font-semibold rounded-xl ${
              deliveryAgent.isAvailable 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-slate-300 hover:bg-slate-400 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            } transition-all duration-200 shadow-md`}
          >
            {deliveryAgent.isAvailable ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                ONLINE - Accepting Orders
              </>
            ) : (
              <>
                <X className="h-5 w-5 mr-2" />
                OFFLINE - Not Accepting Orders
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'home'
                  ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'earnings'
                  ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* New Order Requests */}
            {deliveryAgent.isAvailable && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    New Orders ({newOrders.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await Promise.all([loadDeliveries(), loadNewOrders()]);
                      toast({
                        title: "Refreshed",
                        description: "Orders list updated",
                      });
                    }}
                    className="text-xs"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                {newOrders.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Waiting for new orders...
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Orders will appear here once customers complete payment. Checking every 5 seconds.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  newOrders
                    .filter((order) => order.order !== null && order.order !== undefined)
                    .map((order) => (
                  <Card key={order.id} className="border-2 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white mb-1">
                            Order #{order.order?.id?.slice(-8) || order.id.slice(-8)}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            {order.order?.shop?.name || 'Shop Name Not Available'}
                          </div>
                          <div className="text-lg font-bold text-orange-600 mt-1">
                            ₹{(order.order?.total_amount || 0).toFixed(2)}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          New
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptOrder(order.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectOrder(order.id)}
                          variant="outline"
                          className="flex-1"
                          size="lg"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </div>
            )}

            {/* Active Deliveries */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Navigation className="h-5 w-5 text-orange-600" />
                Active Deliveries ({activeDeliveries.length})
              </h2>
              
              {activeDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      No active deliveries
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      {deliveryAgent.isAvailable 
                        ? "New orders will appear here when available"
                        : "Go online to start receiving orders"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeDeliveries
                  .filter((delivery) => delivery.order !== null && delivery.order !== undefined)
                  .map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-lg">Order #{delivery.order?.id?.slice(-8) || delivery.id.slice(-8)}</div>
                            <div className="text-sm opacity-90">{delivery.order?.shop?.name || 'Shop Name Not Available'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl">₹{(delivery.order?.total_amount || 0).toFixed(2)}</div>
                            <Badge className="bg-white/20 text-white border-0 mt-1">
                              {delivery.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="p-4 space-y-4">
                        {/* Pickup Location - Show when status is ASSIGNED or PICKED_UP */}
                        {(delivery.status === 'ASSIGNED' || delivery.status === 'PICKED_UP') && (
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <Package className="h-4 w-4 text-blue-600" />
                                {delivery.status === 'ASSIGNED' ? 'Pickup Location (Shopkeeper)' : 'Pickup Completed ✓'}
                              </div>
                              {delivery.status === 'ASSIGNED' && (
                                <Button
                                  onClick={async () => {
                                    let lat = delivery.pickup_latitude || delivery.order?.shop_latitude || delivery.order?.shop?.latitude;
                                    let lng = delivery.pickup_longitude || delivery.order?.shop_longitude || delivery.order?.shop?.longitude;
                                    
                                    console.log('🔍 Navigate to Shop - Checking coordinates:', {
                                      deliveryId: delivery.id,
                                      pickup_lat: delivery.pickup_latitude,
                                      pickup_lng: delivery.pickup_longitude,
                                      order_shop_lat: delivery.order?.shop_latitude,
                                      order_shop_lng: delivery.order?.shop_longitude,
                                      shop_lat: delivery.order?.shop?.latitude,
                                      shop_lng: delivery.order?.shop?.longitude,
                                      final_lat: lat,
                                      final_lng: lng
                                    });
                                    
                                    // If coordinates are missing, geocode the address
                                    if (!lat || !lng) {
                                      // Try multiple address sources
                                      const address = 
                                        delivery.pickup_address || 
                                        delivery.order?.shop?.address || 
                                        '';
                                      
                                      console.log('🔍 Address for geocoding:', {
                                        pickup_address: delivery.pickup_address,
                                        shop_address: delivery.order?.shop?.address,
                                        final_address: address
                                      });
                                      
                                      if (!address || address.trim().length === 0) {
                                        console.error('❌ No address available for geocoding');
                                        toast({
                                          variant: "destructive",
                                          title: "Location Error",
                                          description: "Shop address not available. Please contact the shop for address.",
                                        });
                                        return;
                                      }
                                      
                                      toast({
                                        title: "Getting location...",
                                        description: `Finding coordinates for: ${address.substring(0, 30)}...`,
                                      });
                                      
                                      try {
                                        console.log('📍 Starting geocoding for address:', address);
                                        const coords = await geocodeAddress(address);
                                        console.log('📍 Geocoding result:', coords);
                                        
                                        if (coords && coords.latitude && coords.longitude) {
                                          lat = coords.latitude;
                                          lng = coords.longitude;
                                          
                                          console.log('✅ Coordinates found:', { lat, lng });
                                          
                                          // Update delivery record with coordinates
                                          try {
                                            const updateResponse = await fetch('/api/deliveries', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                deliveryId: delivery.id,
                                                pickup_latitude: lat,
                                                pickup_longitude: lng,
                                              }),
                                            });
                                            
                                            const updateResult = await updateResponse.json();
                                            console.log('📍 Update delivery coordinates result:', updateResult);
                                            
                                            // Update local state
                                            setDeliveries(prev => prev.map(d => 
                                              d.id === delivery.id 
                                                ? { ...d, pickup_latitude: lat, pickup_longitude: lng }
                                                : d
                                            ));
                                          } catch (updateError) {
                                            console.warn('⚠️ Failed to update delivery coordinates:', updateError);
                                            // Continue anyway - coordinates are available for navigation
                                          }
                                          
                                          toast({
                                            title: "Location found! ✅",
                                            description: "Opening navigation...",
                                          });
                                          
                                          // Small delay to ensure toast is visible
                                          await new Promise(resolve => setTimeout(resolve, 500));
                                        } else {
                                          console.error('❌ Geocoding returned null or invalid coordinates for address:', address);
                                          // Always open Google Maps as fallback - it's better at finding locations
                                          console.log('📍 Geocoding failed, using Google Maps fallback');
                                          
                                          // Use the original address (not the formatted one) for Google Maps
                                          const mapsSearchAddress = delivery.pickup_address || delivery.order?.shop?.address || address;
                                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchAddress)}`;
                                          
                                          console.log('📍 Opening Google Maps with address:', {
                                            originalAddress: address,
                                            searchAddress: mapsSearchAddress,
                                            mapsUrl: mapsUrl
                                          });
                                          
                                          // Open Google Maps immediately
                                          window.open(mapsUrl, '_blank');
                                          
                                          toast({
                                            title: "Opening Google Maps",
                                            description: `Using Google Maps to find: ${mapsSearchAddress.substring(0, 40)}...`,
                                          });
                                          
                                          return;
                                        }
                                      } catch (error: any) {
                                        console.error('❌ Geocoding error:', error);
                                        // Always open Google Maps as fallback - it's more reliable
                                        console.log('📍 Geocoding error occurred, using Google Maps fallback');
                                        
                                        // Use the original address for Google Maps
                                        const mapsSearchAddress = delivery.pickup_address || delivery.order?.shop?.address || address;
                                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchAddress)}`;
                                        
                                        console.log('📍 Opening Google Maps fallback with address:', {
                                          error: error.message,
                                          searchAddress: mapsSearchAddress,
                                          mapsUrl: mapsUrl
                                        });
                                        
                                        // Open Google Maps immediately
                                        window.open(mapsUrl, '_blank');
                                        
                                        toast({
                                          title: "Opening Google Maps",
                                          description: `Geocoding unavailable. Opening Google Maps with address search...`,
                                        });
                                        
                                        return;
                                      }
                                    }
                                    
                                    if (lat && lng) {
                                      console.log('✅ Opening navigation with coordinates:', { lat, lng });
                                      // Show direction from agent's current location to shopkeeper
                                      openNavigation(lat, lng, undefined, undefined, true);
                                    } else {
                                      console.error('❌ No coordinates available after all attempts');
                                      toast({
                                        variant: "destructive",
                                        title: "Navigation Error",
                                        description: "Unable to get location coordinates. Please contact support.",
                                      });
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                                >
                                  <Navigation className="h-3 w-3 mr-1" />
                                  Navigate to Shop
                                </Button>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                              {delivery.order?.shop?.name || 'Shop Name Not Available'}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {delivery.pickup_address || delivery.order?.shop?.address || 'Address not available'}
                            </div>
                            {delivery.order?.shop?.phone && (
                            <button
                              onClick={() => callNumber(delivery.order.shop.phone)}
                              className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              Call Shop: {delivery.order.shop.phone}
                            </button>
                            )}
                            {delivery.status === 'ASSIGNED' && (
                              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-800 dark:text-blue-200">
                                📍 Navigate from your current location to this shop to pick up the order
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delivery Location - Show when status is PICKED_UP or IN_TRANSIT */}
                        {(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <MapPin className="h-4 w-4 text-green-600" />
                                Delivery Location (Customer)
                              </div>
                              <Button
                                onClick={async () => {
                                  let lat = delivery.delivery_latitude || delivery.order?.customer_latitude;
                                  let lng = delivery.delivery_longitude || delivery.order?.customer_longitude;
                                  
                                  console.log('🔍 Navigate to Customer - Checking coordinates:', {
                                    deliveryId: delivery.id,
                                    delivery_lat: delivery.delivery_latitude,
                                    delivery_lng: delivery.delivery_longitude,
                                    order_customer_lat: delivery.order?.customer_latitude,
                                    order_customer_lng: delivery.order?.customer_longitude,
                                    final_lat: lat,
                                    final_lng: lng
                                  });
                                  
                                  // If coordinates are missing, geocode the address
                                  if (!lat || !lng) {
                                    // Try multiple address sources
                                    const address = 
                                      delivery.delivery_address || 
                                      delivery.order?.customer?.address || 
                                      '';
                                    
                                    console.log('🔍 Address for geocoding:', {
                                      delivery_address: delivery.delivery_address,
                                      customer_address: delivery.order?.customer?.address,
                                      final_address: address
                                    });
                                    
                                    if (!address || address.trim().length === 0) {
                                      console.error('❌ No address available for geocoding');
                                      toast({
                                        variant: "destructive",
                                        title: "Location Error",
                                        description: "Customer address not available. Please contact the customer for address.",
                                      });
                                      return;
                                    }
                                    
                                    toast({
                                      title: "Getting location...",
                                      description: `Finding coordinates for: ${address.substring(0, 30)}...`,
                                    });
                                    
                                    try {
                                      console.log('📍 Starting geocoding for address:', address);
                                      const coords = await geocodeAddress(address);
                                      console.log('📍 Geocoding result:', coords);
                                      
                                      if (coords && coords.latitude && coords.longitude) {
                                        lat = coords.latitude;
                                        lng = coords.longitude;
                                        
                                        console.log('✅ Coordinates found:', { lat, lng });
                                        
                                        // Update delivery record with coordinates
                                        try {
                                          const updateResponse = await fetch('/api/deliveries', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              deliveryId: delivery.id,
                                              delivery_latitude: lat,
                                              delivery_longitude: lng,
                                            }),
                                          });
                                          
                                          const updateResult = await updateResponse.json();
                                          console.log('📍 Update delivery coordinates result:', updateResult);
                                          
                                          // Update local state
                                          setDeliveries(prev => prev.map(d => 
                                            d.id === delivery.id 
                                              ? { ...d, delivery_latitude: lat, delivery_longitude: lng }
                                              : d
                                          ));
                                        } catch (updateError) {
                                          console.warn('⚠️ Failed to update delivery coordinates:', updateError);
                                          // Continue anyway - coordinates are available for navigation
                                        }
                                        
                                        toast({
                                          title: "Location found! ✅",
                                          description: "Opening navigation...",
                                        });
                                        
                                        // Small delay to ensure toast is visible
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                      } else {
                                        console.error('❌ Geocoding returned null or invalid coordinates for address:', address);
                                        // Always open Google Maps as fallback - it's better at finding locations
                                        console.log('📍 Geocoding failed, using Google Maps fallback');
                                        
                                        // Use the original address for Google Maps
                                        const mapsSearchAddress = delivery.delivery_address || delivery.order?.customer?.address || address;
                                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchAddress)}`;
                                        
                                        console.log('📍 Opening Google Maps with address:', {
                                          originalAddress: address,
                                          searchAddress: mapsSearchAddress,
                                          mapsUrl: mapsUrl
                                        });
                                        
                                        // Open Google Maps immediately
                                        window.open(mapsUrl, '_blank');
                                        
                                        toast({
                                          title: "Opening Google Maps",
                                          description: `Using Google Maps to find: ${mapsSearchAddress.substring(0, 40)}...`,
                                        });
                                        
                                        return;
                                      }
                                    } catch (error: any) {
                                      console.error('❌ Geocoding error:', error);
                                      // Always open Google Maps as fallback - it's more reliable
                                      console.log('📍 Geocoding error occurred, using Google Maps fallback');
                                      
                                      // Use the original address for Google Maps
                                      const mapsSearchAddress = delivery.delivery_address || delivery.order?.customer?.address || address;
                                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchAddress)}`;
                                      
                                      console.log('📍 Opening Google Maps fallback with address:', {
                                        error: error.message,
                                        searchAddress: mapsSearchAddress,
                                        mapsUrl: mapsUrl
                                      });
                                      
                                      // Open Google Maps immediately
                                      window.open(mapsUrl, '_blank');
                                      
                                      toast({
                                        title: "Opening Google Maps",
                                        description: `Geocoding unavailable. Opening Google Maps with address search...`,
                                      });
                                      
                                      return;
                                    }
                                  }
                                  
                                  if (lat && lng) {
                                    console.log('✅ Opening navigation with coordinates:', { lat, lng });
                                    // Show direction from agent's current location to customer
                                    // Since order is picked up, agent is at shop location, but we use current location if available
                                    const shopLat = delivery.pickup_latitude || delivery.order?.shop_latitude || delivery.order?.shop?.latitude;
                                    const shopLng = delivery.pickup_longitude || delivery.order?.shop_longitude || delivery.order?.shop?.longitude;
                                    // Use current location if available, otherwise use shop location as origin
                                    openNavigation(lat, lng, shopLat, shopLng, true);
                                  } else {
                                    console.error('❌ No coordinates available after all attempts');
                                    toast({
                                      variant: "destructive",
                                      title: "Navigation Error",
                                      description: "Unable to get location coordinates. Please contact support.",
                                    });
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs border-green-300 text-green-700 hover:bg-green-100 bg-green-50"
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Navigate to Customer
                              </Button>
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                              {delivery.order?.customer?.name || 'Customer Name Not Available'}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {delivery.delivery_address || delivery.order?.customer?.address || 'Address not available'}
                            </div>
                            {(delivery.delivery_phone || delivery.order?.customer?.phone) && (
                            <button
                                onClick={() => callNumber(delivery.delivery_phone || delivery.order?.customer?.phone || '')}
                              className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                                Call Customer: {delivery.delivery_phone || delivery.order?.customer?.phone}
                            </button>
                            )}
                            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-800 dark:text-green-200">
                              📍 Navigate to customer's location to deliver the order
                            </div>
                          </div>
                        )}

                        {/* Action Button - Context-aware based on status */}
                        {delivery.status === 'ASSIGNED' && (
                          <Button
                            onClick={() => {
                              updateDeliveryStatus(delivery.id, 'PICKED_UP');
                            }}
                            disabled={updatingStatus === delivery.id}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                            size="lg"
                          >
                            {updatingStatus === delivery.id ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Mark as Picked Up from Shop
                              </>
                            )}
                          </Button>
                        )}
                        
                        {delivery.status === 'PICKED_UP' && (
                          <Button
                            onClick={() => {
                              updateDeliveryStatus(delivery.id, 'IN_TRANSIT');
                            }}
                            disabled={updatingStatus === delivery.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                            size="lg"
                          >
                            {updatingStatus === delivery.id ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Navigation className="h-5 w-5 mr-2" />
                                Start Delivery to Customer
                              </>
                            )}
                          </Button>
                        )}
                        
                        {delivery.status === 'IN_TRANSIT' && (
                          <Button
                            onClick={() => {
                              openPhotoUploadDialog(delivery);
                            }}
                            disabled={updatingStatus === delivery.id || uploadingPhoto}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-semibold"
                            size="lg"
                          >
                            {updatingStatus === delivery.id || uploadingPhoto ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                {uploadingPhoto ? 'Uploading Photo...' : 'Updating...'}
                              </>
                            ) : (
                              <>
                                <Camera className="h-5 w-5 mr-2" />
                                Mark as Delivered (Upload Photo)
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Show delivery photo if already uploaded */}
                        {delivery.delivery_photo_url && delivery.status === 'DELIVERED' && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                              Delivery Proof Photo:
                            </div>
                            <img 
                              src={delivery.delivery_photo_url} 
                              alt="Delivery proof" 
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {delivery.delivery_photo_uploaded_at && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Uploaded: {new Date(delivery.delivery_photo_uploaded_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="text-sm opacity-90 mb-1">This Week</div>
                  <div className="text-2xl font-bold">₹{earnings.weekly.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="text-sm opacity-90 mb-1">This Month</div>
                  <div className="text-2xl font-bold">₹{earnings.monthly.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Earnings</div>
                  <div className="text-4xl font-bold text-slate-800 dark:text-white">₹{earnings.total.toFixed(2)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {deliveryAgent.totalDeliveries} completed deliveries
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Order History</h2>
              <Button onClick={loadDeliveries} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            {/* History list would go here - fetch completed deliveries */}
          </div>
        )}
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-600" />
              Upload Delivery Proof Photo
            </DialogTitle>
            <DialogDescription>
              Please take or upload a photo of the delivered package as proof of delivery. This photo will be saved with the delivery record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Camera Preview */}
            {isCameraActive ? (
              <div className="space-y-2">
                <Label>Camera Preview</Label>
                <div className="relative rounded-lg border-2 border-slate-300 dark:border-slate-600 overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={capturePhoto}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
            ) : photoPreview ? (
              <div className="space-y-2">
                <Label>Photo Preview</Label>
                <div className="relative rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-4">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-auto rounded-lg max-h-64 object-contain"
                  />
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  No photo selected
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Take a photo or upload an existing image
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Take Photo Button */}
              <Button
                type="button"
                variant="outline"
                onClick={isCameraActive ? stopCamera : startCamera}
                className="flex items-center justify-center gap-2"
                disabled={uploadingPhoto}
              >
                {isCameraActive ? (
                  <>
                    <X className="h-4 w-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </>
                )}
              </Button>

              {/* Upload Photo Button - Always Available */}
              <div className="relative">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handlePhotoSelect(file);
                    // Reset input so same file can be selected again
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={uploadingPhoto}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>
            
            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                💡 Tip: If camera doesn't work, use "Upload Photo" to select an image from your device
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
              Supported formats: JPG, PNG, WEBP (Max 5MB)
            </p>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhotoUpload(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setSelectedDeliveryForPhoto(null);
                }}
                className="flex-1"
                disabled={uploadingPhoto}
              >
                Cancel
              </Button>
              <Button
                onClick={uploadDeliveryPhoto}
                disabled={!photoFile || uploadingPhoto}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {uploadingPhoto ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Mark Delivered
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
