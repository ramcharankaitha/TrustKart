'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, UserPlus, Eye, EyeOff, LogIn, MapPin } from 'lucide-react'
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { geocodeFullAddress } from '@/lib/locationiq-service'

export default function CustomerRegistrationPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.email || !formData.name || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Geocode address if provided
      let latitude: number | undefined;
      let longitude: number | undefined;
      
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
            latitude = coordinates.latitude;
            longitude = coordinates.longitude;
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
          console.error('Geocoding error:', geoError);
          toast({
            variant: "destructive",
            title: "Geocoding Error",
            description: "Could not geocode address. Registration will continue.",
          });
        } finally {
          setGeocodingLoading(false);
        }
      }

      // Build full address string
      const addressParts: string[] = [];
      if (formData.address) addressParts.push(formData.address);
      if (formData.city) addressParts.push(formData.city);
      if (formData.state) addressParts.push(formData.state);
      if (formData.pincode) addressParts.push(formData.pincode);
      const fullAddress = addressParts.join(', ');

      console.log('Creating customer account with data:', {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        address: fullAddress,
        latitude,
        longitude,
        role: 'customer'
      })

      // Create customer account using LoginDatabasePlugin
      const userResult = await LoginDatabasePlugin.createUserAccount({
        email: formData.email,
        name: formData.name,
        role: 'customer',
        phone: formData.phone,
        address: fullAddress,
        password: formData.password,
        latitude,
        longitude,
      } as any)

      console.log('User creation result:', userResult)

      if (userResult.success && userResult.user) {
        console.log('Account created successfully, authenticating...')
        
        // Automatically authenticate the user after registration
        const authResult = await LoginDatabasePlugin.authenticateUser(
          formData.email, 
          formData.password, 
          'customer'
        )

        if (authResult.success) {
          setSuccess(true)
          toast({
            title: "Registration Successful!",
            description: `Welcome ${formData.name}! You are now logged in.`,
          })
          
          // Redirect to dashboard after successful registration and login
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setError('Account created but login failed. Please try logging in manually.')
        }
      } else {
        setError(userResult.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Customer Registration & Login
          </CardTitle>
          <CardDescription>
            Create a customer account with email and password. You'll be automatically logged in after registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your street address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Enter pincode"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || geocodingLoading}
            >
              {loading || geocodingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {geocodingLoading ? 'Getting Location...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Customer Account
                </>
              )}
            </Button>
          </form>

          {success && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription>
                ✅ Customer account created successfully! You are now logged in and will be redirected to the dashboard.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <AlertDescription>
                Error: {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-center text-gray-600 mb-3">
              Already have an account?
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login to Existing Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
