'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, User, Calendar, RefreshCw } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function UpdateUserData() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: ''
  });

  const updateUserData = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get current user session
      const session = sessionStorage.getItem('userSession');
      if (!session) {
        throw new Error('No user session found');
      }

      const user = JSON.parse(session);
      console.log('🔍 Current user:', user);

      if (!user.id) {
        throw new Error('No user ID found');
      }

      // Update user data in database
      const { data, error: updateError } = await SupabaseDB.updateUser(user.id, {
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null
      });

      if (updateError) {
        throw new Error(`Database error: ${updateError.message}`);
      }

      console.log('✅ User data updated:', data);

      // Update session with new data
      const updatedSession = {
        ...user,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender
      };
      sessionStorage.setItem('userSession', JSON.stringify(updatedSession));

      setSuccess(true);
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error updating user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                ✅ Personal information updated successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                placeholder="Select your date of birth"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={updateUserData} 
              disabled={loading || !formData.dateOfBirth || !formData.gender}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Information'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Fill in your date of birth and gender</li>
                <li>Click "Update Information" to save the data</li>
                <li>You'll be redirected to the dashboard with updated information</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
