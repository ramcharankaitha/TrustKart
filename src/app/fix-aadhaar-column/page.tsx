'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

export default function FixAadhaarColumn() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- IMMEDIATE FIX: Add aadhaar_number column to users table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);

-- Step 2: Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'aadhaar_number';

-- Step 3: Check current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            IMMEDIATE FIX: Add Aadhaar Number Column
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> "Could not find the 'aadhaar_number' column of 'users' in the schema cache"
              <br />
              <strong>Solution:</strong> Add the missing column to your database.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Open Supabase Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Go to your Supabase project dashboard and navigate to the SQL Editor.
            </p>

            <h3 className="text-lg font-semibold">Step 2: Copy and Run SQL Script</h3>
            <p className="text-sm text-muted-foreground">
              Copy the SQL script below and paste it into the SQL Editor, then execute it.
            </p>

            <div className="bg-gray-100 p-4 rounded-lg relative">
              <Button 
                onClick={copyToClipboard}
                className="absolute top-2 right-2 flex items-center gap-2"
                size="sm"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <pre className="text-sm overflow-auto pr-20">
                {sqlScript}
              </pre>
            </div>

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
                <li>Adds the missing `aadhaar_number` column to the users table</li>
                <li>Allows shopkeeper registration with Aadhaar number</li>
                <li>Enables Aadhaar number display in Personal Information</li>
                <li>Eliminates the "schema cache" error</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/shopkeeper-registration'} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test Registration After Fix
            </Button>
            
            <Button variant="outline" onClick={() => window.open('https://supabase.com/dashboard', '_blank')} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Supabase Dashboard
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Quick Instructions:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Click "Copy" to copy the SQL script</li>
              <li>Go to Supabase Dashboard → SQL Editor</li>
              <li>Paste the script and click "Run"</li>
              <li>Come back and test the registration</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
