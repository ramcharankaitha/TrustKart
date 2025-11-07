import { NextResponse } from 'next/server';
import { LoginDatabasePlugin } from '@/lib/plugins/enhanced-login-database-plugin';

export async function GET() {
  try {
    // Test registration process
    const testUserData = {
      email: 'test@shopkeeper.com',
      name: 'Test Shopkeeper',
      role: 'SHOPKEEPER',
      password: 'test123',
      phone: '9876543210',
      aadhaarNumber: '123456789012'
    };

    const testShopData = {
      ownerName: 'Test Shopkeeper',
      shopName: 'Test Shop',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      email: 'test@shopkeeper.com',
      mobileNumber: '9876543210',
      dateOfBirth: '1990-01-01',
      aadhaarNumber: '123456789012',
      businessType: 'grocery',
      description: 'Test shop description',
      password: 'test123'
    };

    const results: any = {};

    // Test user creation
    try {
      const userResult = await LoginDatabasePlugin.createUserAccount(testUserData);
      results.userCreated = userResult.success;
      if (!userResult.success) {
        results.userError = userResult.error;
      }
    } catch (error) {
      results.userCreated = false;
      results.userError = error;
    }

    // Test shop creation
    try {
      const shopResult = await LoginDatabasePlugin.createShopRegistration(testShopData);
      results.shopCreated = shopResult.success;
      if (!shopResult.success) {
        results.shopError = shopResult.error;
      }
    } catch (error) {
      results.shopCreated = false;
      results.shopError = error;
    }

    return NextResponse.json({
      success: true,
      message: 'Registration test completed',
      results
    });

  } catch (error) {
    console.error('Registration test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration test failed'
    }, { status: 500 });
  }
}
