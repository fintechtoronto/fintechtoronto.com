import { useEffect } from 'react';

export default function DebugEnv() {
  useEffect(() => {
    console.log('Client-side environment check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set');
    console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set');
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variables Debug</h1>
      <h2>Server-side environment variables:</h2>
      <pre>
        {JSON.stringify(
          {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***present***' : 'not set',
            NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set',
            SANITY_TOKEN: process.env.SANITY_TOKEN ? '***present***' : 'not set',
          },
          null,
          2
        )}
      </pre>
      <h2>Client-side environment variables:</h2>
      <pre>
        {JSON.stringify(
          {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
            NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set',
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}

export async function getServerSideProps() {
  console.log('Server-side environment check:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***present***' : 'not set');
  console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set');
  console.log('SANITY_TOKEN:', process.env.SANITY_TOKEN ? '***present***' : 'not set');

  return {
    props: {},
  };
} 