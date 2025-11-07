'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DatabaseSetup() {
  const [showScript, setShowScript] = useState(false);

  const sqlScript = `-- Add Aadhaar Number Column to Users Table
-- Run this script in your Supabase SQL editor

-- Add aadhaar_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'aadhaar_number'
    ) THEN
        ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(12);
        RAISE NOTICE 'Added aadhaar_number column to users table';
    ELSE
        RAISE NOTICE 'aadhaar_number column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'aadhaar_number';`;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup - Add Aadhaar Number Column
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Database Error Fix:</strong> The error occurs because the `aadhaar_number` column doesn't exist in your database yet. Follow the steps below to fix it.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Access Supabase Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Go to your Supabase project dashboard and navigate to the SQL Editor.
            </p>

            <h3 className="text-lg font-semibold">Step 2: Run the SQL Script</h3>
            <p className="text-sm text-muted-foreground">
              Copy and paste the SQL script below into the SQL Editor and execute it.
            </p>

            <Button 
              onClick={() => setShowScript(!showScript)}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {showScript ? 'Hide SQL Script' : 'Show SQL Script'}
            </Button>

            {showScript && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {sqlScript}
                </pre>
              </div>
            )}

            <h3 className="text-lg font-semibold">Step 3: Test Registration</h3>
            <p className="text-sm text-muted-foreground">
              After running the script, try registering a new shopkeeper with an Aadhaar number.
            </p>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What this fixes:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Adds the `aadhaar_number` column to the users table</li>
                <li>Allows shopkeeper registration with Aadhaar number</li>
                <li>Enables Aadhaar number display in Personal Information</li>
                <li>Prevents the "Database error: {}" message</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/shopkeeper-registration'} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test Registration
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="flex items-center gap-2">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
