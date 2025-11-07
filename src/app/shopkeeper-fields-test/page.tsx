'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Calendar, Mail, MapPin, Home } from 'lucide-react';

export default function ShopkeeperFieldsTest() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const session = sessionStorage.getItem('userSession');
        if (session) {
          const user = JSON.parse(session);
          setUserData(user);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Shopkeeper Fields Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No user session found. Please log in as a shopkeeper to test the fields.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Shopkeeper Registration Fields Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Data Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current User Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{userData.email || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{userData.name || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Mobile Number</p>
                    <p className="text-sm text-muted-foreground">{userData.phone || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {userData.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground">
                      {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Field Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile Number</span>
                  <Badge variant={userData.phone ? "default" : "secondary"}>
                    {userData.phone ? "Set" : "Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Date of Birth</span>
                  <Badge variant={userData.date_of_birth ? "default" : "secondary"}>
                    {userData.date_of_birth ? "Set" : "Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gender</span>
                  <Badge variant={userData.gender ? "default" : "secondary"}>
                    {userData.gender ? "Set" : "Missing"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>To test the new fields:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to the shopkeeper registration page</li>
                  <li>Fill in all the required fields including mobile number, date of birth, and gender</li>
                  <li>Submit the registration form</li>
                  <li>Check this test page to see if the fields are properly stored</li>
                  <li>Go to the shopkeeper dashboard to see if the Personal Information section displays the new fields</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
