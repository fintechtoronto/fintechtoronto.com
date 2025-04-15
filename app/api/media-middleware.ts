import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Setup AWS credentials for S3 operations in server components and API routes.
 * This function ensures that the AWS CLI is configured with the correct profile.
 */
export async function setupAwsCredentials() {
  try {
    // Skip for development environment since local AWS config will be used
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // Check if we have AWS credentials in environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('AWS credentials not found in environment variables for S3 operations');
      return;
    }
    
    // Set AWS profile for this process
    process.env.AWS_PROFILE = 'kabadigital';
    
    // For Windows environments (Amplify uses Linux, so this is for local testing on Windows)
    if (process.platform === 'win32') {
      await execAsync('$env:AWS_PROFILE = "kabadigital"');
    }
    
    // Log success
    console.log('AWS credentials configured for S3 operations');
  } catch (error) {
    console.error('Error setting up AWS credentials:', error);
  }
}

/**
 * Middleware function to setup AWS credentials before handling media-related API requests
 * @param handler - The API route handler function
 * @returns A wrapped handler function with AWS credentials setup
 */
export function withAwsCredentials(handler: Function) {
  return async (...args: any[]) => {
    await setupAwsCredentials();
    return handler(...args);
  };
} 