import { NextRequest, NextResponse } from 'next/server';
import { s3UploadFromServer, s3DeleteFromServer } from '@/lib/s3-upload';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAwsCredentials } from '@/app/api/media-middleware';

// We're using Supabase auth instead of NextAuth
import { createClient } from '@supabase/supabase-js';

// Use a placeholder key for build time to prevent errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-for-build-time';

// Check if we have a service role key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && typeof window === 'undefined') {
  console.warn('No SUPABASE_SERVICE_ROLE_KEY found. Media upload API may not work properly.');
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4', 'video/webm', 'audio/mpeg'
];

async function handlePost(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions if needed
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Form data parsing
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get folder from form data or default to 'general'
    let folder = (formData.get('folder') as string) || 'general';
    
    // Security validation
    if (folder.includes('..') || folder.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Calculate file size in MB
    const fileSizeInMB = file.size / (1024 * 1024);
    
    // Max file size based on type (more restrictive for images, more permissive for videos)
    let maxSizeMB = 5; // Default 5MB
    
    if (file.type.startsWith('image/')) {
      maxSizeMB = 5; // 5MB for images
    } else if (file.type.startsWith('video/')) {
      maxSizeMB = 100; // 100MB for videos
    } else if (file.type.startsWith('audio/')) {
      maxSizeMB = 20; // 20MB for audio
    } else if (file.type === 'application/pdf') {
      maxSizeMB = 10; // 10MB for PDFs
    }
    
    if (fileSizeInMB > maxSizeMB) {
      return NextResponse.json(
        { error: `File size exceeds the ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Create a unique filename and extract file extension
    const fileName = file.name;
    const fileExt = fileName.split('.').pop() || 'file';
    const uniqueFileName = `${Date.now()}-${uuidv4().substring(0, 8)}.${fileExt}`;

    // Create the path (folder/unique-filename)
    const s3Path = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Save the file temporarily to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a temp file path
    const tempFilePath = join('/tmp', uniqueFileName);
    
    // Write the file to temp directory
    await writeFile(tempFilePath, buffer);
    
    // Upload to S3 using the AWS CLI
    const url = await s3UploadFromServer(tempFilePath, s3Path, file.type);
    
    if (!url) {
      return NextResponse.json(
        { error: 'Failed to upload file to S3' },
        { status: 500 }
      );
    }

    // Track the upload in the database if needed
    const { data: mediaEntry, error } = await supabaseAdmin
      .from('media')
      .insert({
        path: s3Path,
        url: url,
        mime_type: file.type,
        size: file.size,
        user_id: user.id,
        original_name: fileName
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording media entry:', error);
      // We still return success as the file was uploaded, even if recording failed
    }

    return NextResponse.json({
      success: true,
      url,
      mediaId: mediaEntry?.id
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDelete(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse JSON request
    const { mediaId, path } = await request.json();
    
    if (!mediaId && !path) {
      return NextResponse.json(
        { error: 'Either mediaId or path must be provided' },
        { status: 400 }
      );
    }

    let s3Path: string;
    
    // If mediaId is provided, get the file path from the database
    if (mediaId) {
      const { data: media, error } = await supabaseAdmin
        .from('media')
        .select('path, user_id')
        .eq('id', mediaId)
        .single();
      
      if (error || !media || !media.path) {
        return NextResponse.json(
          { error: 'Media not found or path is missing' },
          { status: 404 }
        );
      }
      
      // Check if the user owns this media or is an admin
      if (media.user_id !== user.id) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!userData || userData.role !== 'admin') {
          return NextResponse.json(
            { error: 'You do not have permission to delete this media' },
            { status: 403 }
          );
        }
      }
      
      s3Path = media.path;
    } else if (path) {
      // Use the provided path directly
      s3Path = path;
    } else {
      return NextResponse.json(
        { error: 'Valid path is required' },
        { status: 400 }
      );
    }

    // Delete from S3 using the AWS CLI
    const success = await s3DeleteFromServer(s3Path);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file from S3' },
        { status: 500 }
      );
    }

    // If we have a mediaId, remove the entry from the database
    if (mediaId) {
      await supabaseAdmin
        .from('media')
        .delete()
        .eq('id', mediaId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply AWS credentials middleware to our handler functions
export const POST = withAwsCredentials(handlePost);
export const DELETE = withAwsCredentials(handleDelete); 