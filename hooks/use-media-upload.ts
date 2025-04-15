import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || 'https://d1kqhqtkvy9vds.cloudfront.net';

type UploadOptions = {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string, mediaId?: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
};

export function useMediaUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    folder = 'general',
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess,
    onError,
    onProgress,
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Function to check if the file is valid
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds the ${maxSizeMB}MB limit`;
    }

    return null;
  };

  // Function to upload a file
  const uploadFile = async (file: File): Promise<{ url: string; mediaId?: string } | null> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      setUrl(null);

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        if (onError) onError(validationError);
        throw new Error(validationError);
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      // Create a simulated progress interval
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + 5, 95);
          if (onProgress) onProgress(newProgress);
          return newProgress;
        });
      }, 100);

      try {
        // Option 1: Using Supabase Storage (existing method)
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        clearInterval(progressInterval);

        if (error) throw error;

        // Get the public URL
        let fileUrl;

        if (CLOUDFRONT_URL) {
          fileUrl = `${CLOUDFRONT_URL}/media/${fileName}`;
        } else {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }

        setUrl(fileUrl);
        setProgress(100);

        if (onSuccess) onSuccess(fileUrl);
        if (onProgress) onProgress(100);

        return { url: fileUrl };
      } catch (supabaseError) {
        console.error('Supabase storage upload failed, trying direct API upload:', supabaseError);

        // Option 2: Using our custom API endpoint (new method with S3 + CloudFront)
        // Create form data for the API request
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        // Get the session token for authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication required for upload');
        }

        // Upload via our API endpoint
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload file');
        }

        const responseData = await response.json();
        setUrl(responseData.url);
        setProgress(100);

        if (onSuccess) onSuccess(responseData.url, responseData.mediaId);
        if (onProgress) onProgress(100);

        return {
          url: responseData.url,
          mediaId: responseData.mediaId,
        };
      }
    } catch (err) {
      setProgress(0);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to delete a file
  const deleteFile = async (fileUrl: string, mediaId?: string): Promise<boolean> => {
    try {
      let success = false;

      // If we have a mediaId, delete via the API
      if (mediaId) {
        // Get the session token for authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication required for deletion');
        }

        // Delete via our API endpoint
        const response = await fetch('/api/media/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ mediaId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete file');
        }

        success = true;
      } else {
        // Extract path from URL and try to delete via Supabase Storage
        try {
          let path = '';
          
          if (fileUrl.includes(CLOUDFRONT_URL)) {
            // Extract from CloudFront URL
            path = fileUrl.replace(`${CLOUDFRONT_URL}/media/`, '');
          } else {
            // Extract from Supabase URL
            const storageUrl = supabase.storage
              .from('media')
              .getPublicUrl('')
              .data.publicUrl.split('media')[0];
            path = fileUrl.replace(`${storageUrl}media/`, '');
          }

          const { error } = await supabase.storage.from('media').remove([path]);
          if (error) throw error;
          success = true;
        } catch (storageError) {
          console.error('Supabase storage delete failed:', storageError);
          throw storageError;
        }
      }

      if (success) {
        toast({
          title: 'File Deleted',
          description: 'The file was successfully deleted',
        });
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    progress,
    url,
    error,
  };
} 