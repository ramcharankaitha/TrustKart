'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  HardDrive,
  Image,
  File,
  Video,
  Music,
  Archive,
  FileIcon,
  Table
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShopDocument } from '@/lib/types';

interface DocumentPreviewModalProps {
  document: ShopDocument;
  isOpen: boolean;
  onClose: () => void;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="h-8 w-8" />;
  
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return <File className="h-8 w-8 text-red-500" />;
  if (type.includes('image')) return <Image className="h-8 w-8 text-blue-500" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <Table className="h-8 w-8 text-green-500" />;
  if (type.includes('video')) return <Video className="h-8 w-8 text-purple-500" />;
  if (type.includes('audio')) return <Music className="h-8 w-8 text-orange-500" />;
  if (type.includes('zip') || type.includes('rar')) return <Archive className="h-8 w-8 text-yellow-500" />;
  return <FileIcon className="h-8 w-8" />;
};

const getDocumentTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'business_license': 'Business License',
    'gst_certificate': 'GST Certificate',
    'pan_card': 'PAN Card',
    'aadhar_card': 'Aadhar Card',
    'shop_photo': 'Shop Photo',
    'other': 'Other Document'
  };
  return typeMap[type] || type.replace('_', ' ').toUpperCase();
};

export default function DocumentPreviewModal({ document: doc, isOpen, onClose }: DocumentPreviewModalProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      toast({
        variant: "destructive",
        title: "Download Not Available",
        description: "Document download is only available in the browser.",
      });
      return;
    }

    try {
      // Check if we have actual file content (base64)
      if (doc.url && doc.url.startsWith('data:')) {
        // This is a real uploaded file
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Document Downloaded",
          description: `${doc.name} downloaded successfully.`,
        });
      } else {
        // Fallback for demo files
        const content = `Document: ${doc.name}\nType: ${getDocumentTypeLabel(doc.type)}\nSize: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}\nUploaded: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}\n\nThis is a demo doc. In a real application, this would be the actual uploaded file.`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.name}.txt`;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        toast({
          title: "Document Downloaded",
          description: "Demo document downloaded successfully.",
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Unable to download the doc. Please try again.",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getFileIcon(doc.fileType)}
            <div>
              <div className="text-lg font-semibold">{doc.name}</div>
              <div className="text-sm text-muted-foreground">
                {getDocumentTypeLabel(doc.type)}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Document preview and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">File Name:</span>
                  <p className="font-medium">{doc.name}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Document Type:</span>
                  <p className="font-medium">{getDocumentTypeLabel(doc.type)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">File Size:</span>
                  <p className="font-medium">{formatFileSize(doc.fileSize)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">File Type:</span>
                  <p className="font-medium">{doc.fileType || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Uploaded:</span>
                  <p className="font-medium">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Preview Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center gap-4">
                  {getFileIcon(doc.fileType)}
                  <div>
                    <p className="font-medium text-lg">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getDocumentTypeLabel(doc.type)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Demo Preview
                  </Badge>
                </div>
              </div>
              
              {/* Actual Document Content Preview */}
              <div className="mt-4 border rounded-lg p-4 bg-muted/20">
                <h4 className="font-semibold mb-3 text-sm">Document Content Preview</h4>
                
                {/* Document Viewer */}
                <div className="bg-white border rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                  {/* Show actual file content if available */}
                  {doc.url && doc.url.startsWith('data:') ? (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">DOCUMENT PREVIEW</h3>
                        <p className="text-sm text-muted-foreground">{doc.name}</p>
                      </div>
                      
                      {/* Display actual file content based on type */}
                      {doc.fileType?.includes('image') ? (
                        <div className="text-center">
                          <img 
                            src={doc.url} 
                            alt={doc.name}
                            className="max-w-full max-h-96 mx-auto rounded border"
                            style={{ maxHeight: '400px' }}
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Click download to save the original file
                          </p>
                        </div>
                      ) : doc.fileType?.includes('pdf') ? (
                        <div className="text-center space-y-4">
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8">
                            <File className="h-16 w-16 mx-auto mb-4 text-red-500" />
                            <p className="text-lg font-medium mb-2">PDF Document</p>
                            <p className="text-sm text-gray-600 mb-4">{doc.name}</p>
                            <Button onClick={handleDownload} className="mb-2">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                            <p className="text-xs text-gray-500">
                              Click download to view the PDF file
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8">
                            {getFileIcon(doc.fileType)}
                            <p className="text-lg font-medium mb-2 mt-4">{doc.name}</p>
                            <p className="text-sm text-gray-600 mb-4">
                              {doc.fileType || 'Unknown file type'}
                            </p>
                            <Button onClick={handleDownload} className="mb-2">
                              <Download className="h-4 w-4 mr-2" />
                              Download File
                            </Button>
                            <p className="text-xs text-gray-500">
                              Click download to save the original file
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback to demo content for old/demo files */
                    <>
                      {doc.type === 'business_license' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">BUSINESS LICENSE</h3>
                        <p className="text-sm text-muted-foreground">Government of India</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>License Number:</strong> BL-2024-001234</p>
                          <p><strong>Business Name:</strong> {doc.name.replace('.pdf', '')}</p>
                          <p><strong>Owner Name:</strong> John Doe</p>
                          <p><strong>Business Type:</strong> Retail Trade</p>
                        </div>
                        <div>
                          <p><strong>Issue Date:</strong> January 15, 2024</p>
                          <p><strong>Expiry Date:</strong> January 15, 2027</p>
                          <p><strong>Issuing Authority:</strong> Commercial Tax Department</p>
                          <p><strong>Status:</strong> Active</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p><strong>Business Address:</strong></p>
                        <p className="text-sm">123 Main Street, City Center, Mumbai - 400001</p>
                      </div>
                    </div>
                  )}
                  
                  {doc.type === 'gst_certificate' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">GST REGISTRATION CERTIFICATE</h3>
                        <p className="text-sm text-muted-foreground">Goods and Services Tax Department</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>GSTIN:</strong> 27ABCDE1234F1Z5</p>
                          <p><strong>Business Name:</strong> {doc.name.replace('.pdf', '')}</p>
                          <p><strong>Legal Name:</strong> John Doe Trading Co.</p>
                          <p><strong>Trade Name:</strong> Fresh Fields</p>
                        </div>
                        <div>
                          <p><strong>Registration Date:</strong> March 1, 2024</p>
                          <p><strong>Tax Type:</strong> Regular</p>
                          <p><strong>Status:</strong> Active</p>
                          <p><strong>Constitution:</strong> Proprietorship</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p><strong>Principal Place of Business:</strong></p>
                        <p className="text-sm">123 Main Street, City Center, Mumbai - 400001</p>
                      </div>
                    </div>
                  )}
                  
                  {doc.type === 'pan_card' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">INCOME TAX DEPARTMENT</h3>
                        <p className="text-sm text-muted-foreground">Government of India</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>PAN Number:</strong> ABCDE1234F</p>
                          <p><strong>Name:</strong> {doc.name.replace('.pdf', '').replace('AADHAR', 'John Doe')}</p>
                          <p><strong>Father's Name:</strong> Richard Doe</p>
                          <p><strong>Date of Birth:</strong> 15-06-1985</p>
                        </div>
                        <div>
                          <p><strong>Gender:</strong> Male</p>
                          <p><strong>Category:</strong> Individual</p>
                          <p><strong>Issue Date:</strong> April 10, 2024</p>
                          <p><strong>Signature:</strong> [Digital Signature]</p>
                        </div>
                      </div>
                      <div className="border-t pt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          This is a computer generated document and does not require signature
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {doc.type === 'aadhar_card' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">AADHAAR</h3>
                        <p className="text-sm text-muted-foreground">Government of India</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Aadhaar Number:</strong> 1234 5678 9012</p>
                          <p><strong>Name:</strong> {doc.name.replace('.pdf', '').replace('AADHAR', 'John Doe')}</p>
                          <p><strong>Father's Name:</strong> Richard Doe</p>
                          <p><strong>Date of Birth:</strong> 15-06-1985</p>
                        </div>
                        <div>
                          <p><strong>Gender:</strong> Male</p>
                          <p><strong>Address:</strong> [Registered Address]</p>
                          <p><strong>Issue Date:</strong> March 20, 2024</p>
                          <p><strong>Valid Until:</strong> Lifetime</p>
                        </div>
                      </div>
                      <div className="border-t pt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          This is a computer generated document and does not require signature
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {doc.type === 'shop_photo' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">SHOP PHOTOGRAPH</h3>
                        <p className="text-sm text-muted-foreground">Business Premises Documentation</p>
                      </div>
                      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">Shop Exterior View</p>
                        <p className="text-xs text-gray-500">
                          {doc.name.replace('.jpg', '').replace('.png', '')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Shop Name:</strong> {doc.name.replace('.jpg', '').replace('.png', '')}</p>
                          <p><strong>Photo Type:</strong> Exterior View</p>
                          <p><strong>Location:</strong> As per registration address</p>
                        </div>
                        <div>
                          <p><strong>Captured Date:</strong> February 15, 2024</p>
                          <p><strong>Resolution:</strong> 1920x1080</p>
                          <p><strong>File Format:</strong> JPEG/PNG</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {doc.type === 'other' && (
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h3 className="text-lg font-bold">ADDITIONAL DOCUMENT</h3>
                        <p className="text-sm text-muted-foreground">Supporting Documentation</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Document Name:</strong> {doc.name}</p>
                          <p><strong>Document Type:</strong> Additional Document</p>
                          <p><strong>Purpose:</strong> Supporting Documentation</p>
                        </div>
                        <div>
                          <p><strong>Upload Date:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>File Size:</strong> {formatFileSize(doc.fileSize)}</p>
                          <p><strong>File Type:</strong> {doc.fileType || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <strong>Note:</strong> {doc.url && doc.url.startsWith('data:') 
                    ? 'This is a real uploaded doc. Click download to save the original file.'
                    : 'This is a demo preview showing the typical content structure for this document type. In a real application, this would display the actual scanned/uploaded document content with proper PDF viewer or image viewer.'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
