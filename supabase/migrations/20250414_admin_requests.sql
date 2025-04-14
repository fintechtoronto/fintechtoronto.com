-- Create the admin_requests table for users applying to be moderators/admins
CREATE TABLE IF NOT EXISTS public.admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create function to handle auto-updating of the updated_at field
CREATE OR REPLACE FUNCTION public.handle_admin_request_review()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    NEW.reviewed_at = now();
    
    -- If approved, update the user's role
    IF NEW.status = 'approved' THEN
      UPDATE public.profiles
      SET role = 'admin'
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for handling admin request reviews
CREATE TRIGGER on_admin_request_review
BEFORE UPDATE ON public.admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_request_review();

-- Add RLS policies
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "Users can view their own requests" 
  ON public.admin_requests FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());
  
-- Only admins can read all requests
CREATE POLICY "Admins can view all requests" 
  ON public.admin_requests FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));
  
-- Users can submit their own requests
CREATE POLICY "Users can submit requests" 
  ON public.admin_requests FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());
  
-- Only admins can update requests
CREATE POLICY "Admins can update requests" 
  ON public.admin_requests FOR UPDATE
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )); 