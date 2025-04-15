import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Media storage bucket in Supabase
const STORAGE_BUCKET = 'media';

// Update with the actual CloudFront distribution URL
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || 'https://d1kqhqtkvy9vds.cloudfront.net';
const S3_BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'fintoronto-media';

/**
 * Upload a file to the S3 bucket via Supabase Storage
 * @param file The file to upload
 * @param path The path within the storage bucket
 * @returns The URL of the uploaded file
 */
export async function uploadMedia(file: File, path: string = 'general'): Promise<string | null> {
  try {
    // Create a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Return the full URL to the file, using CloudFront if available
    if (CLOUDFRONT_URL) {
      return `${CLOUDFRONT_URL}/${STORAGE_BUCKET}/${fileName}`;
    }
    
    // Fallback to direct Supabase URL if CloudFront isn't configured
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    return null;
  }
}

/**
 * Delete a file from the S3 bucket
 * @param fileUrl The full URL of the file to delete
 * @returns Success boolean
 */
export async function deleteMedia(fileUrl: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    let filePath: string;
    
    if (fileUrl.includes(CLOUDFRONT_URL)) {
      // Extract path from CloudFront URL
      filePath = fileUrl.replace(`${CLOUDFRONT_URL}/${STORAGE_BUCKET}/`, '');
    } else {
      // Extract path from Supabase URL
      const storageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl.split(STORAGE_BUCKET)[0];
      filePath = fileUrl.replace(`${storageUrl}${STORAGE_BUCKET}/`, '');
    }
    
    // Delete the file
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteMedia:', error);
    return false;
  }
}

/**
 * Get a signed URL for temporary access to a private file
 * @param filePath The path to the file within the storage bucket
 * @param expiresIn Expiration time in seconds (default: 60 minutes)
 * @returns The signed URL
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * List files in a directory
 * @param path The directory path within the storage bucket
 * @returns Array of file objects
 */
export async function listMedia(path: string = ''): Promise<any[] | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path);
    
    if (error) {
      console.error('Error listing files:', error);
      return null;
    }
    
    return data.map(item => ({
      ...item,
      url: `${CLOUDFRONT_URL}/${STORAGE_BUCKET}/${path ? `${path}/` : ''}${item.name}`
    }));
  } catch (error) {
    console.error('Error in listMedia:', error);
    return null;
  }
}

/**
 * Server-side function to upload a file directly to S3 using AWS CLI
 * Must be called only from server components or API routes
 * @param filePath Local file path
 * @param destination Path in S3 bucket
 * @param contentType MIME type of the file
 * @returns CloudFront URL to the uploaded file
 */
export async function s3UploadFromServer(
  filePath: string, 
  destination: string, 
  contentType: string
): Promise<string | null> {
  try {
    // This must be executed server-side
    if (typeof window !== 'undefined') {
      throw new Error('s3UploadFromServer can only be called from server components');
    }
    
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Ensure AWS CLI is using the correct profile
    const awsProfileCmd = `$env:AWS_PROFILE = "kabadigital"`;
    await execPromise(awsProfileCmd);
    
    // Upload the file to S3 with the correct content-type
    const cmd = `aws s3 cp "${filePath}" "s3://${S3_BUCKET_NAME}/${destination}" --content-type "${contentType}"`;
    const { stdout, stderr } = await execPromise(cmd);
    
    if (stderr) {
      console.error('Error uploading to S3:', stderr);
      throw new Error(stderr);
    }
    
    console.log('S3 upload success:', stdout);
    
    // Return the CloudFront URL
    return `${CLOUDFRONT_URL}/${destination}`;
  } catch (error) {
    console.error('Error in s3UploadFromServer:', error);
    return null;
  }
}

/**
 * Server-side function to delete a file directly from S3 using AWS CLI
 * Must be called only from server components or API routes
 * @param s3Path Path in S3 bucket to delete
 * @returns Success boolean
 */
export async function s3DeleteFromServer(s3Path: string): Promise<boolean> {
  try {
    // This must be executed server-side
    if (typeof window !== 'undefined') {
      throw new Error('s3DeleteFromServer can only be called from server components');
    }
    
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Ensure AWS CLI is using the correct profile
    const awsProfileCmd = `$env:AWS_PROFILE = "kabadigital"`;
    await execPromise(awsProfileCmd);
    
    // Delete the file from S3
    const cmd = `aws s3 rm "s3://${S3_BUCKET_NAME}/${s3Path}"`;
    const { stdout, stderr } = await execPromise(cmd);
    
    if (stderr) {
      console.error('Error deleting from S3:', stderr);
      throw new Error(stderr);
    }
    
    console.log('S3 delete success:', stdout);
    return true;
  } catch (error) {
    console.error('Error in s3DeleteFromServer:', error);
    return false;
  }
} 