'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { uploadMedia } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MediaUploadProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  path?: string;
  className?: string;
  buttonText?: string;
}

export function MediaUpload({
  onUploadComplete,
  onUploadError,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeMB = 5,
  path = 'general',
  className = '',
  buttonText = 'Upload Media'
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      const errorMsg = `File too large. Maximum size: ${maxSizeMB}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }
    
    // Start upload
    setIsUploading(true);
    
    // Simulate progress for better UX (actual upload doesn't provide progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      const url = await uploadMedia(file, path);
      
      clearInterval(progressInterval);
      
      if (!url) {
        throw new Error('Upload failed');
      }
      
      setUploadProgress(100);
      setSuccess(true);
      onUploadComplete?.(url);
      
      // Reset after success
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSuccess(false);
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
      
    } catch (err) {
      clearInterval(progressInterval);
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="sr-only"
      />
      
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        variant={error ? "destructive" : success ? "default" : "outline"}
        className="w-full"
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4 animate-pulse" />
            Uploading...
          </span>
        ) : success ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Upload Complete
          </span>
        ) : error ? (
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {buttonText}
          </span>
        )}
      </Button>
      
      {isUploading && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
} 