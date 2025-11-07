'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Phone,
  MapPin,
  Save,
  LogOut,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // App Settings
  const [appSettings, setAppSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    maintenanceMode: false,
    autoApproveShops: false,
    requireEmailVerification: true
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await LoginDatabasePlugin.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // In real app, call API to update profile
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppSettingsUpdate = async () => {
    setLoading(true);
    try {
      // In real app, call API to update app settings
      toast({
        title: "Settings Updated",
        description: "App settings have been updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match",
      });
      return;
    }

    if (securityData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setLoading(true);
    try {
      // In real app, call API to change password
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully",
      });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await LoginDatabasePlugin.logoutUser();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  return (
    <div className="container mx-auto my-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">App Settings, Admin Profile, Logout</p>
      </div>

      <div className="space-y-8">
        {/* Admin Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Admin Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleProfileUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Notification Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={appSettings.emailNotifications}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={appSettings.smsNotifications}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={appSettings.pushNotifications}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Platform Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put the platform in maintenance mode</p>
                  </div>
                  <Switch
                    checked={appSettings.maintenanceMode}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Approve Shops</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve new shop registrations</p>
                  </div>
                  <Switch
                    checked={appSettings.autoApproveShops}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, autoApproveShops: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new users</p>
                  </div>
                  <Switch
                    checked={appSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAppSettingsUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Platform Version</Label>
                <p className="text-muted-foreground">TrustKart v1.0.0</p>
              </div>
              <div>
                <Label>Database Status</Label>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </div>
              </div>
              <div>
                <Label>Last Backup</Label>
                <p className="text-muted-foreground">2024-01-25 10:30:00</p>
              </div>
              <div>
                <Label>Server Status</Label>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Logout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Sign out of your admin account. You'll need to log in again to access the admin dashboard.
                </p>
              </div>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}