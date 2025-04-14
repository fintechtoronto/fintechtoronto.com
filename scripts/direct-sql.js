// Script to directly apply RLS policies to the series table
// Run this with: node scripts/direct-sql.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Simplified SQL statement to directly add admin access to series table
const sql = `
-- Enable RLS on series table
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies for this table
DROP POLICY IF EXISTS "Admins can perform all operations on series" ON public.series;
DROP POLICY IF EXISTS "Anyone can read approved series" ON public.series;
DROP POLICY IF EXISTS "Users can read their own series" ON public.series;

-- Create admin access policy
CREATE POLICY "Admins can perform all operations on series" ON public.series
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
    )
  );

-- Create policy for reading approved series
CREATE POLICY "Anyone can read approved series" ON public.series
  FOR SELECT
  USING (status = 'approved');

-- Create policy for users to read their own series
CREATE POLICY "Users can read their own series" ON public.series
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
`;

async function executeSQL() {
  console.log('Applying RLS policies to series table...');
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error('❌ Error applying policies:', error.message);
    console.error('Details:', error);
  } else {
    console.log('✅ Series table RLS policies applied successfully!');
  }
}

executeSQL().catch(err => {
  console.error('❌ Failed to execute SQL:', err.message);
}); 