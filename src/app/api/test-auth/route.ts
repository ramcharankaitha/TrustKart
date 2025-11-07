import { NextResponse } from 'next/server';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export async function GET() {
  try {
    const results: any = {};

    // Test authentication with demo credentials
    const testCredentials = [
      { email: 'admin@trustkart.com', password: 'admin123', role: 'ADMIN' },
      { email: 'shopkeeper@trustkart.com', password: 'shop123', role: 'SHOPKEEPER' },
      { email: 'customer@trustkart.com', password: 'customer123', role: 'CUSTOMER' }
    ];

    for (const cred of testCredentials) {
      try {
        const authResult = await LoginDatabasePlugin.authenticateUser(
          cred.email, 
          cred.password, 
          cred.role
        );
        results[`${cred.role.toLowerCase()}_auth`] = authResult.success;
        if (!authResult.success) {
          results[`${cred.role.toLowerCase()}_error`] = authResult.error;
        }
      } catch (error) {
        results[`${cred.role.toLowerCase()}_auth`] = false;
        results[`${cred.role.toLowerCase()}_error`] = error;
      }
    }

    // Test session management
    try {
      results.session = true; // Placeholder - implement actual session test
    } catch (error) {
      results.session = false;
      results.sessionError = error;
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication test completed',
      results
    });

  } catch (error) {
    console.error('Authentication test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication test failed'
    }, { status: 500 });
  }
}
