-- Create a policy to allow superadmins and admins to perform all operations on series
CREATE POLICY IF NOT EXISTS "Admins can perform all operations on series" ON public.series
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
    )
  );

-- Ensure RLS is enabled on the series table
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Create additional policy to allow all users to read approved series
CREATE POLICY IF NOT EXISTS "Anyone can read approved series" ON public.series
  FOR SELECT
  USING (status = 'approved');

-- Create policy to allow users to read their own series
CREATE POLICY IF NOT EXISTS "Users can read their own series" ON public.series
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Add function to check if a user has admin privileges
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 