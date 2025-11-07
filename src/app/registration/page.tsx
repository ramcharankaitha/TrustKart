'use client';

import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf, User, Store, CheckCircle, XCircle, Loader2, 
  Sparkles, Mail, Phone, MapPin, Building, FileText,
  ArrowLeft, Eye, EyeOff, Upload, FileImage, Shield,
  AlertTriangle, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';
import type { ShopDocument } from '@/lib/types';

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong' };
};

// Business types
const businessTypes = [
  'Grocery Store',
  'Pharmacy',
  'Restaurant',
  'Bakery',
  'Vegetable Shop',
  'Fruit Shop',
  'Meat Shop',
  'Dairy Shop',
  'General Store',
  'Electronics',
  'Clothing',
  'Hardware Store',
  'Book Store',
  'Stationery',
  'Other'
];

// Document types
const documentTypes = [
  { id: 'business_license', name: 'Business License', required: true },
  { id: 'pan_card', name: 'PAN Card', required: true },
  { id: 'shopkeeper_photo', name: 'Shopkeeper Photo', required: true },
  { id: 'shop_photo', name: 'Shop Photo', required: true },
  { id: 'aadhar_card', name: 'Aadhar Card', required: true },
  { id: 'gst_certificate', name: 'GST Certificate', required: false },
];

export default function EnhancedShopkeeperRegistration() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    
    // Shop Information
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    city: '',
    state: '',
    pincode: '',
    shopPhone: '',
    shopEmail: '',
    businessType: '',
    
    // Business Details
    gstNumber: '',
    panNumber: '',
    shopLicenseNumber: '',
  });

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (documentType: string, file: File) => {
    console.log('📤 File upload triggered:', documentType, file.name, file.size, file.type);
    
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload only JPEG, PNG, WebP, or PDF files.",
      });
      return;
    }
    
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes');
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload files smaller than 5MB.",
      });
      return;
    }
    
    setUploadedFiles(prev => {
      const updated = { ...prev, [documentType]: file };
      console.log('✅ File added to state:', documentType, 'Total files:', Object.keys(updated).filter(k => updated[k] !== null).length);
      console.log('📋 Current uploadedFiles:', Object.keys(updated).filter(k => updated[k] !== null));
      return updated;
    });
    
    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded successfully.`,
    });
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Personal Information Validation
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!formData.address.trim()) errors.push('Address is required');
    if (!formData.password) errors.push('Password is required');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    if (passwordStrength.score < 3) errors.push('Password is too weak');
    
    // Shop Information Validation
    if (!formData.shopName.trim()) errors.push('Shop name is required');
    if (!formData.shopAddress.trim()) errors.push('Shop address is required');
    if (!formData.city.trim()) errors.push('City is required');
    if (!formData.state.trim()) errors.push('State is required');
    if (!formData.pincode.trim()) errors.push('Pincode is required');
    if (!formData.shopPhone.trim()) errors.push('Shop phone is required');
    if (!formData.businessType) errors.push('Business type is required');
    
    // Document Validation
    const requiredDocs = documentTypes.filter(doc => doc.required);
    for (const doc of requiredDocs) {
      if (!uploadedFiles[doc.id]) {
        errors.push(`${doc.name} is required`);
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setLoading(false);
      return;
    }

    try {
      // Create user account
      const userResult = await LoginDatabasePlugin.createUserAccount({
        email: formData.email,
        name: formData.name,
        role: 'shopkeeper',
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      });

      if (userResult.success && userResult.user) {
        // Register shop with comprehensive details
        const shopResult = await LoginDatabasePlugin.registerShop({
          shopkeeperId: userResult.user.id,
          name: formData.shopName,
          address: formData.shopAddress,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.shopPhone,
          email: formData.shopEmail,
          businessType: formData.businessType,
          description: formData.shopDescription,
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber,
          shopLicenseNumber: formData.shopLicenseNumber,
          status: 'pending',
        });

        if (shopResult.success && shopResult.shop) {
          console.log('✅ Shop created successfully. Shop ID:', shopResult.shop.id);
          
          // Documents are only for preview - not stored anywhere
          const documentCount = Object.values(uploadedFiles).filter(f => f !== null).length;
          console.log(`📋 Documents were previewed during registration: ${documentCount} files (not stored)`);
          
          setSuccess(true);
          toast({
            title: "Registration Successful!",
            description: `Your shopkeeper account and shop registration have been submitted for review.`,
          });
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setError(shopResult.error || 'Shop registration failed');
          toast({
            variant: "destructive",
            title: "Shop Registration Failed",
            description: shopResult.error || "There was an error registering your shop.",
          });
        }
      } else {
        setError(userResult.error || 'User registration failed');
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: userResult.error || "There was an error creating your account.",
        });
      }
    } catch (error) {
      setError('An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900 flex items-center justify-center p-4">
        <Card className="card-elevated border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Registration Successful!</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Your shopkeeper account and shop registration have been submitted for review. 
                  You'll receive an email confirmation shortly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Redirecting to login...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-blue-100/50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156, 146, 172, 0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-3 font-bold text-4xl text-slate-800 dark:text-white hover:text-primary transition-colors duration-300 group">
            <div className="relative">
              <Leaf className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              TrustKart
            </span>
          </Link>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-4 font-medium">
            Complete Shopkeeper Registration
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Step {currentStep} of 3: {
                currentStep === 1 ? 'Personal Information' :
                currentStep === 2 ? 'Shop Details' : 'Document Upload'
              }
            </p>
          </div>
        </div>

        {/* Main Form */}
        <Card className="card-elevated border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-slate-800 dark:text-white">
              Shopkeeper Registration
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 dark:text-slate-300">
              Complete your registration to start selling on TrustKart
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Personal Information</h3>
                      <p className="text-slate-600 dark:text-slate-300">Tell us about yourself</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="input-professional h-12"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="input-professional h-12"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="input-professional h-12"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Address *
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="input-professional min-h-[48px]"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="input-professional h-12 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                                  passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                                  'bg-green-500 w-full'
                                }`}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              passwordStrength.strength === 'weak' ? 'text-red-600' :
                              passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {passwordStrength.strength.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                              <div key={key} className={`flex items-center gap-1 ${
                                passed ? 'text-green-600' : 'text-slate-500'
                              }`}>
                                {passed ? <Check className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="input-professional h-12"
                        required
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-red-500 text-xs">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shop Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Store className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Shop Information</h3>
                      <p className="text-slate-600 dark:text-slate-300">Tell us about your shop</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="shopName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Shop Name *
                        </Label>
                        <Input
                          id="shopName"
                          type="text"
                          placeholder="Enter your shop name"
                          value={formData.shopName}
                          onChange={(e) => handleInputChange('shopName', e.target.value)}
                          className="input-professional h-12"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessType" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Business Type *
                        </Label>
                        <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                          <SelectTrigger className="input-professional h-12">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shopDescription" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Shop Description
                      </Label>
                      <Textarea
                        id="shopDescription"
                        placeholder="Describe your shop and what you sell"
                        value={formData.shopDescription}
                        onChange={(e) => handleInputChange('shopDescription', e.target.value)}
                        className="input-professional min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shopAddress" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Shop Address *
                      </Label>
                      <Textarea
                        id="shopAddress"
                        placeholder="Enter complete shop address"
                        value={formData.shopAddress}
                        onChange={(e) => handleInputChange('shopAddress', e.target.value)}
                        className="input-professional min-h-[80px]"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          City *
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="Enter city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="input-professional h-12"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          State *
                        </Label>
                        <Input
                          id="state"
                          type="text"
                          placeholder="Enter state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="input-professional h-12"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Pincode *
                        </Label>
                        <Input
                          id="pincode"
                          type="text"
                          placeholder="Enter pincode"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          className="input-professional h-12"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="shopPhone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Shop Phone *
                        </Label>
                        <Input
                          id="shopPhone"
                          type="tel"
                          placeholder="+91 9876543210"
                          value={formData.shopPhone}
                          onChange={(e) => handleInputChange('shopPhone', e.target.value)}
                          className="input-professional h-12"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="shopEmail" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Shop Email
                        </Label>
                        <Input
                          id="shopEmail"
                          type="email"
                          placeholder="shop@example.com"
                          value={formData.shopEmail}
                          onChange={(e) => handleInputChange('shopEmail', e.target.value)}
                          className="input-professional h-12"
                        />
                      </div>
                    </div>
                    
                    {/* Business Registration Details */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Business Registration Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            GST Number
                          </Label>
                          <Input
                            id="gstNumber"
                            type="text"
                            placeholder="22ABCDE1234F1Z5"
                            value={formData.gstNumber}
                            onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                            className="input-professional h-12"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="panNumber" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            PAN Number
                          </Label>
                          <Input
                            id="panNumber"
                            type="text"
                            placeholder="ABCDE1234F"
                            value={formData.panNumber}
                            onChange={(e) => handleInputChange('panNumber', e.target.value)}
                            className="input-professional h-12"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="shopLicenseNumber" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Shop License Number
                          </Label>
                          <Input
                            id="shopLicenseNumber"
                            type="text"
                            placeholder="Enter license number"
                            value={formData.shopLicenseNumber}
                            onChange={(e) => handleInputChange('shopLicenseNumber', e.target.value)}
                            className="input-professional h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                      <FileImage className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Document Upload</h3>
                      <p className="text-slate-600 dark:text-slate-300">Upload required documents for verification</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {documentTypes.map((doc) => (
                      <div key={doc.id} className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {doc.name} {doc.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary transition-colors">
                          {uploadedFiles[doc.id] ? (
                            <div className="space-y-2">
                              <FileText className="h-8 w-8 text-green-500 mx-auto" />
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {uploadedFiles[doc.id]!.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {(uploadedFiles[doc.id]!.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setUploadedFiles(prev => ({ ...prev, [doc.id]: null }))}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                PNG, JPG, WebP, PDF up to 5MB
                              </p>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  console.log('📁 File input changed for', doc.id, ':', file ? file.name : 'no file');
                                  if (file) {
                                    console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
                                    handleFileUpload(doc.id, file);
                                  } else {
                                    console.warn('⚠️ No file selected');
                                  }
                                  // Reset input to allow selecting same file again
                                  e.target.value = '';
                                }}
                                className="hidden"
                                id={`upload-${doc.id}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                              >
                                Choose File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      <strong>Important:</strong> All documents will be verified before approval. 
                      Please ensure documents are clear and readable. Your registration will be reviewed within 24-48 hours.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(currentStep - 1);
                    } else {
                      router.push('/login');
                    }
                  }}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentStep === 1 ? 'Back to Login' : 'Previous'}
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="btn-primary rounded-xl"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="btn-primary rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Registration...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}