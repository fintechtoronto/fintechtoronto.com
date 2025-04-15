// Debug script to print environment variables
console.log('Environment Variables Debug:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***present***' : 'not set');
console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set');
console.log('SANITY_TOKEN:', process.env.SANITY_TOKEN ? '***present***' : 'not set'); 