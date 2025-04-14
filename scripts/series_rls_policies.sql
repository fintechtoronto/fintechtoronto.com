-- RLS Policies for Series Table
-- Run this in the Supabase Dashboard SQL Editor

-- Enable RLS on series table (if not already enabled)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies 
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