'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Leaf, Upload, FileText, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Shield, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShopRegistrationRequest, ShopDocument } from '@/lib/types';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';
import { geocodeFullAddress } from '@/lib/locationiq-service';

export default function ShopkeeperRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<ShopDocument[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    ownerName: '',
    shopName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    businessType: '',
    description: '',
    password: '',
    confirmPassword: '',
  });

  const requiredDocuments = [
    { type: 'business_license', name: 'Business License', required: true },
    { type: 'gst_certificate', name: 'GST Certificate', required: true },
    { type: 'pan_card', name: 'PAN Card', required: true },
    { type: 'aadhar_card', name: 'Aadhar Card', required: true },
    { type: 'shop_photo', name: 'Shop Photo', required: true },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Password validation functions
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach(check => {
      if (check) score += 20;
    });

    return { score, checks };
  };

  const getPasswordStrengthLabel = (score: number) => {
    if (score < 40) return { label: 'Weak', color: 'text-red-500' };
    if (score < 80) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const validatePassword = (password: string) => {
    const { checks } = getPasswordStrength(password);
    const errors = [];

    if (!checks.length) errors.push('At least 8 characters');
    if (!checks.lowercase) errors.push('One lowercase letter');
    if (!checks.uppercase) errors.push('One uppercase letter');
    if (!checks.number) errors.push('One number');
    if (!checks.special) errors.push('One special character');

    return { isValid: errors.length === 0, errors };
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const passwordValidation = formData.password ? validatePassword(formData.password) : { isValid: false, errors: [] };
  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : { score: 0, checks: {} };
  const strengthLabel = getPasswordStrengthLabel(passwordStrength.score);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileUpload = (type: string, file: File) => {
    // Check file size (limit to 2MB for localStorage compatibility)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload files smaller than 2MB for demo purposes.",
      });
      return;
    }

    // For demo purposes, create a placeholder document instead of storing actual file content
    const document: ShopDocument = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as ShopDocument['type'],
      name: file.name,
      url: `demo-file-${type}-${Date.now()}`, // Store a reference instead of actual content
      uploadedAt: new Date(),
      fileSize: file.size,
      fileType: file.type,
    };
    
    setUploadedDocuments(prev => {
      const filtered = prev.filter(doc => doc.type !== type);
      return [...filtered, document];
    });
    
    toast({
      title: "Document Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = ['ownerName', 'shopName', 'address', 'city', 'state', 'pincode', 'email', 'mobileNumber', 'dateOfBirth', 'aadhaarNumber', 'businessType', 'password', 'confirmPassword'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: `Please fill in: ${missingFields.join(', ')}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Validate password
      if (!passwordValidation.isValid) {
        toast({
          variant: "destructive",
          title: "Weak Password",
          description: "Please ensure your password meets all security requirements.",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate password confirmation
      if (!passwordsMatch) {
        toast({
          variant: "destructive",
          title: "Password Mismatch",
          description: "Password and confirmation do not match.",
        });
        setIsSubmitting(false);
        return;
      }

      // Check required documents
      const missingDocs = requiredDocuments.filter(doc => 
        doc.required && !uploadedDocuments.some(uploaded => uploaded.type === doc.type)
      );
      
      if (missingDocs.length > 0) {
        toast({
          variant: "destructive",
          title: "Missing Documents",
          description: `Please upload: ${missingDocs.map(doc => doc.name).join(', ')}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Geocode address for shop location
      let shopLatitude: number | undefined;
      let shopLongitude: number | undefined;
      
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
          shopLatitude = coordinates.latitude;
          shopLongitude = coordinates.longitude;
          toast({
            title: "Location Found",
            description: "Your shop address has been geocoded successfully.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Location Not Found",
            description: "Could not geocode your shop address. Registration will continue without coordinates.",
          });
        }
      } catch (geoError) {
        console.error('Shop geocoding error:', geoError);
        toast({
          variant: "destructive",
          title: "Geocoding Error",
          description: "Could not geocode address. Registration will continue.",
        });
      } finally {
        setGeocodingLoading(false);
      }

      // Use the complete shop registration process
      const registrationResult = await LoginDatabasePlugin.registerShop({
        ownerName: formData.ownerName,
        shopName: formData.shopName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        aadhaarNumber: formData.aadhaarNumber,
        businessType: formData.businessType,
        description: formData.description,
        password: formData.password,
        latitude: shopLatitude,
        longitude: shopLongitude,
      } as any);

      if (registrationResult.success) {
        toast({
          title: "Registration Submitted",
          description: "Your shop registration has been submitted for review. You'll be notified once approved.",
        });

        // Try to authenticate the user (this will fail if shop is not approved)
        const authResult = await LoginDatabasePlugin.authenticateUser(formData.email, formData.password, 'shopkeeper');
        
        if (authResult.success) {
          toast({
            title: "Registration Complete",
            description: "Your shop registration has been submitted for review. You'll be notified once approved.",
          });
          router.push('/dashboard');
        } else {
          // Shop is not approved yet, but registration was successful
          toast({
            title: "Registration Submitted",
            description: "Your shop registration has been submitted for review. You'll be notified once approved.",
          });
          router.push('/login');
        }
      } else {
        // Handle specific error cases
        if (registrationResult.code === 'EMAIL_EXISTS') {
          toast({
            variant: "destructive",
            title: "Email Already Exists",
            description: "This email address is already registered. Please use a different email or try logging in instead.",
          });
        } else if (registrationResult.code === 'FOREIGN_KEY_CONSTRAINT') {
          toast({
            variant: "destructive",
            title: "Registration Error",
            description: "There was an issue linking your account to the shop. Please try again or contact support.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: registrationResult.error || "Failed to register shop. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "There was an error submitting your registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent hydration mismatch by not rendering form until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-muted/40 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="flex items-center justify-center gap-2 font-semibold font-headline text-2xl">
              <Leaf className="h-8 w-8 text-primary" />
              <span>TrustKart</span>
            </Link>
            <h1 className="text-3xl font-bold mt-4">Shopkeeper Registration</h1>
            <p className="text-muted-foreground mt-2">
              Register your shop to start selling on TrustKart
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 font-semibold font-headline text-2xl">
            <Leaf className="h-8 w-8 text-primary" />
            <span>TrustKart</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Shopkeeper Registration</h1>
          <p className="text-muted-foreground mt-2">
            Register your shop to start selling on TrustKart
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          {/* Shop Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shop Details
              </CardTitle>
              <CardDescription>
                Provide your shop information
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="ownerName">Shopkeeper Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  placeholder="Enter shopkeeper full name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  placeholder="Enter your shop name"
                  required
                  suppressHydrationWarning
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shop Address * (Location will be automatically detected)
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete shop address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Enter pincode"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="mobileNumber">Phone Number *</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                <Input
                  id="aadhaarNumber"
                  type="text"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength={12}
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grocery">Grocery Store</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="dairy">Dairy Products</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your business..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Create a secure password for your shopkeeper account
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="pr-10"
                    suppressHydrationWarning
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Password Strength:</span>
                      <span className={strengthLabel.color}>{strengthLabel.label}</span>
                    </div>
                    <Progress value={passwordStrength.score} className="h-2" />
                    
                    {/* Password Requirements */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {passwordValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </div>
                      ))}
                      {passwordValidation.isValid && (
                        <div className="flex items-center gap-1 text-green-500 col-span-2">
                          <CheckCircle className="h-3 w-3" />
                          Password meets all requirements
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="pr-10"
                    suppressHydrationWarning
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2">
                    {passwordsMatch ? (
                      <div className="flex items-center gap-1 text-green-500 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Passwords match
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="md:col-span-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password Security Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Use a combination of letters, numbers, and special characters</li>
                    <li>• Avoid using personal information like your name or shop name</li>
                    <li>• Don't reuse passwords from other accounts</li>
                    <li>• Consider using a password manager for better security</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Required Documents
              </CardTitle>
              <CardDescription>
                Upload the required documents for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredDocuments.map((doc) => {
                const uploadedDoc = uploadedDocuments.find(d => d.type === doc.type);
                return (
                  <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {uploadedDoc ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <Label className="font-medium">{doc.name}</Label>
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                        {uploadedDoc && (
                          <p className="text-sm text-muted-foreground">{uploadedDoc.name}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        id={`file-${doc.type}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(doc.type, file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant={uploadedDoc ? "outline" : "default"}
                        onClick={() => document.getElementById(`file-${doc.type}`)?.click()}
                      >
                        {uploadedDoc ? "Change" : "Upload"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || geocodingLoading}
              className="px-8"
            >
              {isSubmitting || geocodingLoading ? (
                <>
                  <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {geocodingLoading ? "Getting Location..." : "Submitting..."}
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
