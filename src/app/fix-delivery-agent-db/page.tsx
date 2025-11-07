'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function SimpleMigrationPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const sqlCommands = `-- Fix delivery agent database schema
-- Run these commands in your Supabase SQL Editor

-- Add missing columns to delivery_agents table
ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create delivery_agent_documents table
CREATE TABLE IF NOT EXISTS delivery_agent_documents (
    id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
    delivery_agent_id TEXT NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('driving_license', 'aadhaar_card', 'vehicle_rc', 'pan_card', 'profile_photo')),
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_agent_id ON delivery_agent_documents(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_type ON delivery_agent_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_verified ON delivery_agent_documents(is_verified);

-- Verify the changes
SELECT 'Migration completed successfully!' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name IN ('rejection_reason', 'reviewed_by', 'reviewed_at');
SELECT COUNT(*) as delivery_agents_count FROM delivery_agents;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCommands);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "SQL commands copied to clipboard. Paste them in your Supabase SQL Editor.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the SQL commands below.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            Database Migration Fix
          </h1>
          <p className="text-muted-foreground">Fix the "column delivery_agents.rejection_reason does not exist" error</p>
        </div>
        <Link href="/delivery-agent-admin-panel">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Database Schema Error</h3>
              <p className="text-red-700 text-sm">
                The error "column delivery_agents.rejection_reason does not exist" indicates that your database 
                is missing the enhanced schema columns. Follow the steps below to fix this issue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Step-by-Step Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-1">Copy SQL Commands</h3>
              <p className="text-sm text-muted-foreground mb-2">Click the copy button below</p>
              <Button onClick={copyToClipboard} size="sm" disabled={copied}>
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy SQL'}
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-1">Open Supabase</h3>
              <p className="text-sm text-muted-foreground mb-2">Go to your Supabase project</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Supabase Dashboard
                </a>
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-1">Run SQL</h3>
              <p className="text-sm text-muted-foreground mb-2">Paste and execute in SQL Editor</p>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                SQL Editor
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SQL Commands */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SQL Migration Commands
            </CardTitle>
            <Button onClick={copyToClipboard} variant="outline" size="sm" disabled={copied}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap">{sqlCommands}</pre>
          </div>
        </CardContent>
      </Card>

      {/* What This Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>What This Migration Fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-red-600">Before Migration:</h4>
              <ul className="space-y-1 text-sm text-red-700">
                <li>❌ Error: "column delivery_agents.rejection_reason does not exist"</li>
                <li>❌ Admin approvals don't reflect properly</li>
                <li>❌ No rejection reason tracking</li>
                <li>❌ No document management</li>
                <li>❌ Delivery agents can't be approved/rejected</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-600">After Migration:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ All delivery agent data loads properly</li>
                <li>✅ Admin approvals work correctly</li>
                <li>✅ Rejection reasons are stored and displayed</li>
                <li>✅ Document viewing functionality works</li>
                <li>✅ Complete audit trail of reviews</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>After Running the Migration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Once you've run the SQL commands in Supabase, the delivery agent system will work properly:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/delivery-agent-admin-panel">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Admin Panel
                </Button>
              </Link>
              <Link href="/delivery-agent-workflow-test">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Workflow
                </Button>
              </Link>
              <Link href="/delivery-agent-registration">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Registration
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
