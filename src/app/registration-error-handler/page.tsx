'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertCircle, 
  Mail,
  User,
  Store,
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export default function RegistrationErrorHandler() {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkEmail = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setIsChecking(true);
    setError(null);
    setCheckResult(null);

    try {
      const result = await LoginDatabasePlugin.checkEmailExists(email);
      setCheckResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Email check failed');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (exists: boolean) => {
    if (exists) {
      return <Badge variant="destructive">Email Already Exists</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">Email Available</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Registration Error Handler</h1>
          <p className="text-muted-foreground">
            Fix registration issues and check email availability
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Email Checker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Availability Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email to check"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button 
                onClick={checkEmail} 
                disabled={isChecking || !email}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isChecking ? 'Checking...' : 'Check Email'}
              </Button>

              {checkResult && (
                <div className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(checkResult.exists)}
                  </div>
                  
                  {checkResult.exists && checkResult.user && (
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Existing User:</strong> {checkResult.user.name}</p>
                      <p><strong>Role:</strong> {checkResult.user.role}</p>
                      <p><strong>Created:</strong> {new Date(checkResult.user.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Error Solutions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Common Error Solutions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Duplicate Email Error:</strong> The email address already exists in the system.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <h4 className="font-semibold mb-2">Solution 1: Use Different Email</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Try registering with a different email address.
                  </p>
                  <Link href="/shopkeeper-registration">
                    <Button size="sm" className="w-full">
                      <Store className="h-4 w-4 mr-2" />
                      Try Registration Again
                    </Button>
                  </Link>
                </div>

                <div className="p-3 border rounded">
                  <h4 className="font-semibold mb-2">Solution 2: Login Instead</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    If you already have an account, try logging in.
                  </p>
                  <Link href="/login">
                    <Button size="sm" variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Go to Login
                    </Button>
                  </Link>
                </div>

                <div className="p-3 border rounded">
                  <h4 className="font-semibold mb-2">Solution 3: Reset Password</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    If you forgot your password, contact support.
                  </p>
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Issues */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Fixed Registration Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Duplicate Email Error:</strong> Now properly detected and handled with helpful messages.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Database Schema Issues:</strong> Enhanced error handling for missing columns.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Connection Errors:</strong> Better fallback mechanisms for database connectivity.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ User-Friendly Messages:</strong> Clear error messages instead of technical codes.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Email Validation:</strong> Pre-check email availability before registration.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Multiple Fallbacks:</strong> Prisma → Supabase → Basic fields → Clear errors.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/shopkeeper-registration">
                <Button className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Try Registration Again
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Login Instead
                </Button>
              </Link>
              
              <Link href="/supabase-debug">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Debug Database
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

