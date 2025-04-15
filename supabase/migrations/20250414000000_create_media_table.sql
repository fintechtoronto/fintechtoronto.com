-- Create media table to track uploaded files
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  original_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS media_user_id_idx ON public.media(user_id);

-- Enable RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Policy for users to see all media
CREATE POLICY "Users can view all media" ON public.media
  FOR SELECT
  USING (true);

-- Policy for users to insert their own media
CREATE POLICY "Users can insert their own media" ON public.media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own media
CREATE POLICY "Users can update their own media" ON public.media
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own media
CREATE POLICY "Users can delete their own media" ON public.media
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to media table
DROP TRIGGER IF EXISTS set_updated_at ON public.media;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 