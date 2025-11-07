'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Leaf, ArrowLeft, Mail, Lock, UserIcon, Phone, 
  MapPin, FileText, Eye, EyeOff, CheckCircle,
  Upload, X, FileImage, Loader2, Sprout
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geocodeFullAddress } from '@/lib/locationiq-service';

export default function FarmerRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File | null>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    aadhaarNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    farmName: '',
    farmAddress: '',
    farmSize: '',
    cropsGrown: '',
    organicCertification: '',
  });

  const router = useRouter();
  const { toast } = useToast();

  // Required documents for farmer registration
  const requiredDocuments = [
    { 
      type: 'aadhaar_card', 
      name: 'Aadhaar Card', 
      required: true,
      description: 'Front and back of Aadhaar card'
    },
    { 
      type: 'pan_card', 
      name: 'PAN Card', 
      required: true,
      description: 'PAN card for tax purposes'
    },
    { 
      type: 'farm_license', 
      name: 'Farm License/Registration', 
      required: false,
      description: 'Farm registration or license document'
    },
    { 
      type: 'organic_certificate', 
      name: 'Organic Certification', 
      required: false,
      description: 'Organic certification document (if available)'
    },
    { 
      type: 'profile_photo', 
      name: 'Profile Photo', 
      required: true,
      description: 'Clear photo of yourself'
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (documentType: string, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload JPEG, PNG, WebP, or PDF files only.",
      });
      return;
    }
    
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "File size must be less than 5MB.",
      });
      return;
    }
    
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in address, city, state, and pincode before geocoding.",
      });
      return;
    }

    setGeocodingLoading(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}`;
      const result = await geocodeFullAddress(fullAddress);
      
      if (result.success && result.data) {
        toast({
          title: "Location Found",
          description: `Coordinates: ${result.data.lat}, ${result.data.lon}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Geocoding Failed",
          description: "Could not find coordinates for this address. You can still submit without coordinates.",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to geocode address. You can still submit without coordinates.",
      });
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = ['name', 'email', 'password', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Check required documents
    const requiredDocTypes = requiredDocuments.filter(doc => doc.required).map(doc => doc.type);
    const missingDocs = requiredDocTypes.filter(docType => !uploadedDocuments[docType]);
    
    if (missingDocs.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Required Documents",
        description: `Please upload: ${missingDocs.map(type => requiredDocuments.find(d => d.type === type)?.name).join(', ')}`,
      });
      return;
    }

    setLoading(true);

    try {
      // Try to geocode address if coordinates not available
      let agentLatitude: number | undefined;
      let agentLongitude: number | undefined;

      if (formData.address && formData.city && formData.state && formData.pincode) {
        try {
          const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}`;
          const geocodeResult = await geocodeFullAddress(fullAddress);
          if (geocodeResult.success && geocodeResult.data) {
            agentLatitude = geocodeResult.data.lat;
            agentLongitude = geocodeResult.data.lon;
          }
        } catch (error) {
          console.log('Geocoding failed, continuing without coordinates');
        }
      }

      // Prepare FormData
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('phone', formData.phone);
      submitData.append('aadhaarNumber', formData.aadhaarNumber);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('state', formData.state);
      submitData.append('pincode', formData.pincode);
      submitData.append('farmName', formData.farmName);
      submitData.append('farmAddress', formData.farmAddress);
      submitData.append('farmSize', formData.farmSize);
      submitData.append('cropsGrown', formData.cropsGrown);
      submitData.append('organicCertification', formData.organicCertification);
      
      if (agentLatitude !== undefined) submitData.append('latitude', agentLatitude.toString());
      if (agentLongitude !== undefined) submitData.append('longitude', agentLongitude.toString());
      
      // Add uploaded documents
      Object.entries(uploadedDocuments).forEach(([type, file]) => {
        if (file) {
          submitData.append(`document_${type}`, file);
        }
      });

      const response = await fetch('/api/farmers/register', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Registration Successful!",
          description: "Your farmer application has been submitted for review. You will be notified via email once approved.",
        });
        
        // Redirect to login page
        router.push('/login');
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || "Failed to register. Please try again.",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during registration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
              Farmer Registration
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Join our platform to sell your organic vegetables. Your application will be reviewed by our admin team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="9876543210"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>Your residential address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address, house number"
                    required
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="123456"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocodeAddress}
                  disabled={geocodingLoading}
                >
                  {geocodingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Location Coordinates
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Farm Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Farm Information
                </CardTitle>
                <CardDescription>Details about your farm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input
                      id="farmName"
                      value={formData.farmName}
                      onChange={(e) => handleInputChange('farmName', e.target.value)}
                      placeholder="e.g., Green Valley Organic Farm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmSize">Farm Size</Label>
                    <Input
                      id="farmSize"
                      value={formData.farmSize}
                      onChange={(e) => handleInputChange('farmSize', e.target.value)}
                      placeholder="e.g., 5 acres, 2 hectares"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmAddress">Farm Address</Label>
                  <Textarea
                    id="farmAddress"
                    value={formData.farmAddress}
                    onChange={(e) => handleInputChange('farmAddress', e.target.value)}
                    placeholder="Farm location address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropsGrown">Crops Grown (comma-separated)</Label>
                  <Input
                    id="cropsGrown"
                    value={formData.cropsGrown}
                    onChange={(e) => handleInputChange('cropsGrown', e.target.value)}
                    placeholder="e.g., Tomatoes, Spinach, Carrots, Potatoes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organicCertification">Organic Certification</Label>
                  <Input
                    id="organicCertification"
                    value={formData.organicCertification}
                    onChange={(e) => handleInputChange('organicCertification', e.target.value)}
                    placeholder="e.g., NPOP Certified, USDA Organic"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documents Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Required Documents
                </CardTitle>
                <CardDescription>Upload the following documents for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredDocuments.map((doc) => (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Label className="font-semibold">
                          {doc.name} {doc.required && <span className="text-red-500">*</span>}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      </div>
                      {uploadedDocuments[doc.type] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedDocuments(prev => {
                              const newDocs = { ...prev };
                              delete newDocs[doc.type];
                              return newDocs;
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {uploadedDocuments[doc.type] ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {uploadedDocuments[doc.type]?.name}
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.type, file);
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                By registering, you agree to our terms and conditions.
              </p>
              <Button type="submit" disabled={loading} size="lg" className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

