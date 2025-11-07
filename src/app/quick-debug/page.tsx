'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function QuickDebug() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  const loadDbData = async () => {
    if (!sessionData?.id) {
      setError('No user ID in session');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching user data for ID:', sessionData.id);
      const { data, error } = await SupabaseDB.getUserById(sessionData.id);
      
      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        setDbData(null);
      } else {
        console.log('✅ Database data:', data);
        setDbData(data);
        setError('');
      }
    } catch (error: any) {
      console.error('❌ Error loading DB data:', error);
      setError(`Error: ${error.message}`);
      setDbData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionWithDbData = () => {
    if (dbData && sessionData) {
      const updatedSession = {
        ...sessionData,
        phone: dbData.phone,
        date_of_birth: dbData.date_of_birth,
        gender: dbData.gender
      };
      
      sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
      setSessionData(updatedSession);
      
      // Reload the page to refresh the dashboard
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Quick Debug - Personal Information Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button onClick={loadDbData} disabled={loading || !sessionData?.id} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {loading ? 'Loading...' : 'Check Database'}
            </Button>
            <Button onClick={updateSessionWithDbData} disabled={!dbData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Update Session & Reload
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Current Session Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionData ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>ID:</strong> {sessionData.id}</div>
                    <div><strong>Name:</strong> {sessionData.name || 'Not set'}</div>
                    <div><strong>Email:</strong> {sessionData.email || 'Not set'}</div>
                    <div><strong>Phone:</strong> {sessionData.phone || 'Not set'}</div>
                    <div><strong>Date of Birth:</strong> {sessionData.date_of_birth || 'Not set'}</div>
                    <div><strong>Gender:</strong> {sessionData.gender || 'Not set'}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No session data</p>
                )}
              </CardContent>
            </Card>

            {/* Database Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dbData ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>ID:</strong> {dbData.id}</div>
                    <div><strong>Name:</strong> {dbData.name || 'Not set'}</div>
                    <div><strong>Email:</strong> {dbData.email || 'Not set'}</div>
                    <div><strong>Phone:</strong> {dbData.phone || 'Not set'}</div>
                    <div><strong>Date of Birth:</strong> {dbData.date_of_birth || 'Not set'}</div>
                    <div><strong>Gender:</strong> {dbData.gender || 'Not set'}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Click "Check Database" to load data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Check Database" to see what's actually stored in the database</li>
                <li>If database has the data but session doesn't, click "Update Session & Reload"</li>
                <li>This will update your session and reload the dashboard with correct data</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
