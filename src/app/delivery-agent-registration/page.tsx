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
  Truck, ArrowLeft, Mail, Lock, UserIcon, Phone, 
  MapPin, Car, FileText, Eye, EyeOff, CheckCircle,
  Upload, X, FileImage, FileText as FileTextIcon, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geocodeFullAddress } from '@/lib/locationiq-service';

export default function DeliveryAgentRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File | null>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    aadhaarNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const router = useRouter();
  const { toast } = useToast();

  // Required documents for delivery agent registration
  const requiredDocuments = [
    { 
      type: 'driving_license', 
      name: 'Driving License', 
      required: true,
      description: 'Valid driving license for the vehicle type'
    },
    { 
      type: 'aadhaar_card', 
      name: 'Aadhaar Card', 
      required: true,
      description: 'Front and back of Aadhaar card'
    },
    { 
      type: 'vehicle_rc', 
      name: 'Vehicle Registration Certificate', 
      required: true,
      description: 'RC book or smart card for your vehicle'
    },
    { 
      type: 'pan_card', 
      name: 'PAN Card', 
      required: true,
      description: 'PAN card for tax purposes'
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
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload only JPEG, PNG, WebP, or PDF files.",
      });
      return;
    }
    
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload files smaller than 5MB.",
      });
      return;
    }
    
    setUploadedDocuments(prev => ({ ...prev, [documentType]: file }));
    toast({
      title: "Document Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const removeDocument = (documentType: string) => {
    setUploadedDocuments(prev => ({ ...prev, [documentType]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = ['name', 'email', 'password', 'phone', 'vehicleType', 'address'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: `Please fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Check if all required documents are uploaded
    const missingDocuments = requiredDocuments
      .filter(doc => doc.required && !uploadedDocuments[doc.type])
      .map(doc => doc.name);
    
    if (missingDocuments.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Documents",
        description: `Please upload: ${missingDocuments.join(', ')}`,
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number.",
      });
      return;
    }

    setLoading(true);

    try {
      // Geocode address for delivery agent location
      let agentLatitude: number | undefined;
      let agentLongitude: number | undefined;
      
      if (formData.address || formData.city || formData.state || formData.pincode) {
        setGeocodingLoading(true);
        try {
          const { coordinates } = await geocodeFullAddress({
            street: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: 'India'
          });
          
          if (coordinates) {
            agentLatitude = coordinates.latitude;
            agentLongitude = coordinates.longitude;
            toast({
              title: "Location Found",
              description: "Your address has been geocoded successfully.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Location Not Found",
              description: "Could not geocode your address. Registration will continue without coordinates.",
            });
          }
        } catch (geoError) {
          console.error('Delivery agent geocoding error:', geoError);
          toast({
            variant: "destructive",
            title: "Geocoding Error",
            description: "Could not geocode address. Registration will continue.",
          });
        } finally {
          setGeocodingLoading(false);
        }
      }

      // Create FormData to handle file uploads
      const submitData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });
      
      // Add location data
      if (agentLatitude !== undefined) submitData.append('latitude', agentLatitude.toString());
      if (agentLongitude !== undefined) submitData.append('longitude', agentLongitude.toString());
      
      // Add uploaded documents
      Object.entries(uploadedDocuments).forEach(([type, file]) => {
        if (file) {
          submitData.append(`document_${type}`, file);
        }
      });

      const response = await fetch('/api/delivery-agents/register', {
        method: 'POST',
        body: submitData, // Use FormData instead of JSON
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Registration Successful!",
          description: "Your delivery agent application has been submitted for review. You will be notified via email once approved.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl text-slate-800 dark:text-white hover:text-primary transition-colors duration-300">
          <Truck className="h-8 w-8 text-orange-600" />
          <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            TrustKart Delivery
          </span>
        </Link>

        {/* Back Button */}
        <Link href="/login">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-8 min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
                <Truck className="h-8 w-8 text-orange-600" />
                Become a Delivery Agent
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-lg">
                Join TrustKart's delivery network and start earning today
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-orange-600" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Full Name *</Label>
                      <div className="relative mt-1">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone Number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter your phone number"
                          className="pl-10 h-12"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Car className="h-5 w-5 text-orange-600" />
                    Vehicle Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleType" className="text-slate-700 dark:text-slate-300">Vehicle Type *</Label>
                      <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="bicycle">Bicycle</SelectItem>
                          <SelectItem value="auto">Auto Rickshaw</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="vehicleNumber" className="text-slate-700 dark:text-slate-300">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                        placeholder="Enter vehicle number"
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Documentation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Documentation
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber" className="text-slate-700 dark:text-slate-300">Driving License Number</Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        placeholder="Enter license number"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <Label htmlFor="aadhaarNumber" className="text-slate-700 dark:text-slate-300">Aadhaar Number</Label>
                      <Input
                        id="aadhaarNumber"
                        type="text"
                        value={formData.aadhaarNumber}
                        onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                        placeholder="Enter Aadhaar number"
                        className="h-12"
                        maxLength={12}
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-orange-600" />
                    Required Documents
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Please upload clear, readable copies of all required documents. All documents will be verified during the approval process.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {requiredDocuments.map((doc) => {
                      const uploadedFile = uploadedDocuments[doc.type];
                      return (
                        <div key={doc.type} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-slate-800 dark:text-slate-200">
                                  {doc.name}
                                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                                </h4>
                                {uploadedFile && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {doc.description}
                              </p>
                              {uploadedFile && (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                  {uploadedFile.type.startsWith('image/') ? (
                                    <FileImage className="h-4 w-4" />
                                  ) : (
                                    <FileTextIcon className="h-4 w-4" />
                                  )}
                                  <span>{uploadedFile.name}</span>
                                  <span className="text-slate-500">
                                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadedFile ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDocument(doc.type)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              ) : (
                                <div>
                                  <input
                                    type="file"
                                    id={`file-${doc.type}`}
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(doc.type, file);
                                    }}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => document.getElementById(`file-${doc.type}`)?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    Address (Location will be automatically detected)
                  </h3>
                  
                  <div>
                    <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Street Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your street address"
                      className="mt-1 min-h-[80px]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-slate-700 dark:text-slate-300">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state" className="text-slate-700 dark:text-slate-300">State</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Enter state"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pincode" className="text-slate-700 dark:text-slate-300">Pincode</Label>
                      <Input
                        id="pincode"
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        placeholder="Enter pincode"
                        className="h-12"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Why Join TrustKart Delivery?</h4>
                  <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Flexible working hours
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Competitive delivery fees
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Real-time order tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Support team assistance
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || geocodingLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white font-semibold"
                >
                  {loading || geocodingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {geocodingLoading ? 'Getting Location...' : 'Submitting Application...'}
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Truck className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Terms */}
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  By submitting this application, you agree to TrustKart's terms and conditions. 
                  Your application will be reviewed and you'll be notified of the status within 2-3 business days.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center p-6">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          © 2024 TrustKart Delivery. All rights reserved.
        </p>
      </div>
    </div>
  );
}
