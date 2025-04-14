-- Create subscribers table
CREATE TABLE public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (newsletter signup)
CREATE POLICY "Allow public to insert subscribers" ON public.subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for authenticated select
CREATE POLICY "Allow authenticated users to view subscribers" ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index on email for faster lookups
CREATE INDEX idx_subscribers_email ON public.subscribers(email);

-- Create function to check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscribers WHERE email = email_address
  );
END;
$$; 