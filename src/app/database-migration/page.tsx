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
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface MigrationStatus {
  hasNewColumns: boolean;
  hasDocumentsTable: boolean;
  columns: Array<{ column_name: string; data_type: string }>;
  needsMigration: boolean;
}

export default function DatabaseMigrationPage() {
  const { toast } = useToast();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Checking migration status...');
      
      const response = await fetch('/api/migrate-delivery-agents');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Migration status:', data);
        
        if (data.success) {
          setMigrationStatus(data.migrationStatus);
        } else {
          throw new Error(data.error || 'Failed to check migration status');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check migration status');
      }
    } catch (error: any) {
      console.error('❌ Error checking migration status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check migration status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      setMigrating(true);
      console.log('🔧 Running database migration check...');
      
      const response = await fetch('/api/migrate-delivery-agents', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Migration result:', data);
        
        if (data.success) {
          if (data.needsMigration) {
            toast({
              title: "Migration Required",
              description: "Please run the SQL commands manually in your Supabase SQL Editor. Check the instructions below.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Database Up to Date!",
              description: "Your database schema is already up to date. The delivery agent system should work properly.",
            });
          }
          
          // Refresh migration status
          await checkMigrationStatus();
        } else {
          throw new Error(data.error || 'Migration check failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration check failed');
      }
    } catch (error: any) {
      console.error('❌ Migration error:', error);
      toast({
        title: "Migration Check Failed",
        description: error.message || "Failed to check migration status",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  const getStatusBadge = (status: boolean) => {
    if (status) {
      return { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' };
    } else {
      return { variant: 'destructive' as const };
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            Database Migration
          </h1>
          <p className="text-muted-foreground">Fix the delivery agent database schema issues</p>
        </div>
        <Button onClick={checkMigrationStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Refresh Status'}
        </Button>
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
                is missing the enhanced schema columns. Run the migration below to fix this issue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      {migrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Enhanced Columns</h4>
                  <p className="text-sm text-muted-foreground">rejection_reason, reviewed_by, reviewed_at</p>
                </div>
                <Badge {...getStatusBadge(migrationStatus.hasNewColumns)}>
                  {getStatusIcon(migrationStatus.hasNewColumns)}
                  <span className="ml-1">{migrationStatus.hasNewColumns ? 'Present' : 'Missing'}</span>
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Documents Table</h4>
                  <p className="text-sm text-muted-foreground">delivery_agent_documents</p>
                </div>
                <Badge {...getStatusBadge(migrationStatus.hasDocumentsTable)}>
                  {getStatusIcon(migrationStatus.hasDocumentsTable)}
                  <span className="ml-1">{migrationStatus.hasDocumentsTable ? 'Present' : 'Missing'}</span>
                </Badge>
              </div>
            </div>

            {migrationStatus.columns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Found Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {migrationStatus.columns.map((col, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800">
                      {col.column_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {migrationStatus.needsMigration && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">Migration Required</h4>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  Your database is missing required columns and tables. Click the button below to run the migration.
                </p>
                <Button 
                  onClick={runMigration} 
                  disabled={migrating}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Migration...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Run Migration
                    </>
                  )}
                </Button>
              </div>
            )}

            {!migrationStatus.needsMigration && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Migration Complete</h4>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  Your database schema is up to date. The delivery agent system should work properly now.
                </p>
                <div className="flex gap-2">
                  <Link href="/delivery-agent-admin-panel">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Admin Panel
                    </Button>
                  </Link>
                  <Link href="/delivery-agent-workflow-test">
                    <Button variant="outline">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Test Workflow
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Migration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If the automatic migration doesn't work, you can run the SQL commands manually:
          </p>
          <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`-- Add missing columns to delivery_agents table
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
);`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
