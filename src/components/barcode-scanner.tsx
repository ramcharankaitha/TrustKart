'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Scan, 
  X, 
  CheckCircle, 
  AlertCircle,
  Package,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcodeData: {
    barcode: string;
    productName?: string;
    brand?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
  }) => void;
  onClose: () => void;
}

interface ProductData {
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string;
}

export default function BarcodeScanner({ onBarcodeScanned, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permission and try again.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a barcode number"
      });
      return;
    }
    
    await lookupProduct(manualBarcode.trim());
  };

  const lookupProduct = async (barcode: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate barcode lookup - in real implementation, you'd use a barcode API
      // For demo purposes, we'll simulate some common product lookups
      const mockProductData = getMockProductData(barcode);
      
      if (mockProductData) {
        setScannedBarcode(barcode);
        setProductData(mockProductData);
        
        toast({
          title: "Product Found!",
          description: `Found product: ${mockProductData.title || 'Unknown Product'}`
        });
      } else {
        setError('Product not found in database. You can still add it manually.');
        setScannedBarcode(barcode);
        setProductData({
          title: 'Unknown Product',
          description: 'Product not found in database'
        });
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
      setError('Failed to lookup product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockProductData = (barcode: string): ProductData | null => {
    // Mock product database - in real implementation, this would be an API call
    const mockProducts: Record<string, ProductData> = {
      '1234567890123': {
        title: 'Coca-Cola Classic',
        brand: 'Coca-Cola',
        category: 'Beverages',
        description: 'Classic Coca-Cola soft drink',
        image: '/api/placeholder/200/200'
      },
      '2345678901234': {
        title: 'Lays Classic Potato Chips',
        brand: 'Lays',
        category: 'Snacks',
        description: 'Classic salted potato chips',
        image: '/api/placeholder/200/200'
      },
      '3456789012345': {
        title: 'Nestle KitKat',
        brand: 'Nestle',
        category: 'Confectionery',
        description: 'Chocolate wafer bar',
        image: '/api/placeholder/200/200'
      },
      '4567890123456': {
        title: 'Tide Laundry Detergent',
        brand: 'Tide',
        category: 'Household',
        description: 'Original scent laundry detergent',
        image: '/api/placeholder/200/200'
      },
      '5678901234567': {
        title: 'iPhone 15',
        brand: 'Apple',
        category: 'Electronics',
        description: 'Latest iPhone model',
        image: '/api/placeholder/200/200'
      }
    };

    return mockProducts[barcode] || null;
  };

  const handleUseProduct = () => {
    if (scannedBarcode && productData) {
      onBarcodeScanned({
        barcode: scannedBarcode,
        productName: productData.title,
        brand: productData.brand,
        category: productData.category,
        description: productData.description,
        imageUrl: productData.image
      });
      onClose();
    }
  };

  const resetScanner = () => {
    setScannedBarcode('');
    setProductData(null);
    setError('');
    setManualBarcode('');
    stopCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Camera Scanner</Label>
              {!isScanning ? (
                <Button onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Stop Camera
                </Button>
              )}
            </div>
            
            {isScanning && (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg p-8">
                    <Scan className="h-12 w-12 text-white" />
                    <p className="text-white text-sm mt-2">Point camera at barcode</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Barcode Entry */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Manual Entry</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter barcode number manually"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleManualBarcodeSubmit}
                disabled={isLoading || !manualBarcode.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
                Lookup
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Product Found Display */}
          {scannedBarcode && productData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Product Found!</span>
              </div>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-lg">{productData.title}</h3>
                        {productData.brand && (
                          <p className="text-sm text-gray-600">Brand: {productData.brand}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Barcode: {scannedBarcode}</Badge>
                        {productData.category && (
                          <Badge variant="outline">{productData.category}</Badge>
                        )}
                      </div>
                      {productData.description && (
                        <p className="text-sm text-gray-600">{productData.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleUseProduct} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Product
                </Button>
                <Button onClick={resetScanner} variant="outline">
                  Scan Another
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Start Camera" to activate barcode scanning</li>
              <li>• Point your camera at a product barcode</li>
              <li>• Or manually enter a barcode number and click "Lookup"</li>
              <li>• Review the product information and click "Use This Product"</li>
              <li>• You can then modify the details before saving</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
