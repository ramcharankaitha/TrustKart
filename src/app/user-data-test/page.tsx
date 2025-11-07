'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Phone, Calendar, Mail, RefreshCw, Database } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function UserDataTest() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = () => {
    try {
      const session = sessionStorage.getItem('userSession');
      if (session) {
        setSessionData(JSON.parse(session));
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const loadDbData = async () => {
    if (!sessionData?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await SupabaseDB.getUserById(sessionData.id);
      if (error) {
        console.error('Database error:', error);
        setDbData({ error: error.message });
      } else {
        setDbData(data);
      }
    } catch (error: any) {
      console.error('Error loading DB data:', error);
      setDbData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = () => {
    loadSessionData();
    if (sessionData?.id) {
      loadDbData();
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Data Test - Personal Information Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex gap-4">
            <Button onClick={refreshSession} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button onClick={loadDbData} disabled={loading || !sessionData?.id} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {loading ? 'Loading...' : 'Load from Database'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Storage Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionData ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{sessionData.email || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">{sessionData.name || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Mobile Number</p>
                        <p className="text-sm text-muted-foreground">{sessionData.phone || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-sm text-muted-foreground">
                          {sessionData.date_of_birth ? new Date(sessionData.date_of_birth).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Gender</p>
                        <p className="text-sm text-muted-foreground">
                          {sessionData.gender ? sessionData.gender.charAt(0).toUpperCase() + sessionData.gender.slice(1) : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No session data found</p>
                )}
              </CardContent>
            </Card>

            {/* Database Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Database Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dbData ? (
                  dbData.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{dbData.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{dbData.email || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{dbData.name || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Mobile Number</p>
                          <p className="text-sm text-muted-foreground">{dbData.phone || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Date of Birth</p>
                          <p className="text-sm text-muted-foreground">
                            {dbData.date_of_birth ? new Date(dbData.date_of_birth).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Gender</p>
                          <p className="text-sm text-muted-foreground">
                            {dbData.gender ? dbData.gender.charAt(0).toUpperCase() + dbData.gender.slice(1) : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <p className="text-muted-foreground">Click "Load from Database" to fetch data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Session Data:</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Database Data:</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(dbData, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Check if session data includes the new fields (phone, date_of_birth, gender)</li>
                <li>Click "Load from Database" to see what's actually stored in the database</li>
                <li>If session data is missing fields but database has them, the dashboard should auto-refresh</li>
                <li>If both are missing, the user needs to re-register or update their profile</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
