'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, CheckCircle, RefreshCw } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function FixGenderNow() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = () => {
    try {
      const session = sessionStorage.getItem('userSession');
      if (session) {
        setSessionData(JSON.parse(session));
      } else {
        setError('No user session found. Please log in first.');
      }
    } catch (error) {
      setError('Error loading session data');
    }
  };

  const updateGender = async () => {
    if (!sessionData?.id || !selectedGender) {
      setError('Please select a gender');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🔍 Updating gender for user:', sessionData.id, 'to:', selectedGender);

      // Update gender in database
      const { data, error: updateError } = await SupabaseDB.updateUser(sessionData.id, {
        gender: selectedGender
      });

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }

      console.log('✅ Gender updated successfully:', data);

      // Update session with new gender
      const updatedSession = {
        ...sessionData,
        gender: selectedGender
      };
      sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
      setSessionData(updatedSession);

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error updating gender:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Fix Gender Information
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
              <AlertDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ✅ Gender updated successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {sessionData && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Current User:</strong> {sessionData.name} ({sessionData.email})
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Your Gender:</label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={updateGender} 
                disabled={loading || !selectedGender}
                className="w-full flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {loading ? 'Updating...' : 'Update Gender'}
              </Button>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Quick Fix:</strong> Select your gender and click "Update Gender" to fix the Personal Information display immediately.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
