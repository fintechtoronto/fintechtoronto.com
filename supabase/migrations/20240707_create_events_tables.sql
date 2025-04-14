-- Create events table to mirror Sanity events for registration tracking
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sanity_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  event_type TEXT,
  max_attendees INTEGER,
  cal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  attendee_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  check_in_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on event_id for faster queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);

-- Create unique index to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_event_email ON public.event_registrations(event_id, email);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Allow public read access to events" 
ON public.events FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to create events" 
ON public.events FOR INSERT 
TO authenticated
USING (true);

CREATE POLICY "Allow event creators to update their events" 
ON public.events FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND (
      is_admin = true OR
      auth.uid() IN (SELECT created_by FROM public.events WHERE id = public.events.id)
    )
  )
);

-- Create policies for event registrations
CREATE POLICY "Allow users to register for events" 
ON public.event_registrations FOR INSERT 
TO authenticated
USING (true);

CREATE POLICY "Allow public to register for events" 
ON public.event_registrations FOR INSERT 
USING (true);

CREATE POLICY "Allow users to view their own registrations" 
ON public.event_registrations FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Allow admins to view all registrations" 
ON public.event_registrations FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Function to sync events from Sanity to Supabase
CREATE OR REPLACE FUNCTION sync_event_from_sanity()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle insert or update from webhook
  INSERT INTO public.events (
    sanity_id,
    title,
    slug,
    description,
    date,
    location,
    event_type,
    max_attendees,
    cal_id
  ) VALUES (
    NEW.sanity_id,
    NEW.title,
    NEW.slug,
    NEW.description,
    NEW.date,
    NEW.location,
    NEW.event_type,
    NEW.max_attendees,
    NEW.cal_id
  )
  ON CONFLICT (sanity_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    date = EXCLUDED.date,
    location = EXCLUDED.location,
    event_type = EXCLUDED.event_type,
    max_attendees = EXCLUDED.max_attendees,
    cal_id = EXCLUDED.cal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to send notifications when attendance is close to max
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  current_count INTEGER;
  capacity_threshold FLOAT;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM public.events WHERE id = NEW.event_id;
  
  -- If event has max_attendees set
  IF event_record.max_attendees IS NOT NULL THEN
    -- Count current registrations
    SELECT COUNT(*) INTO current_count 
    FROM public.event_registrations 
    WHERE event_id = NEW.event_id AND status = 'confirmed';
    
    -- Set threshold at 80% capacity
    capacity_threshold := event_record.max_attendees * 0.8;
    
    -- If we're at or above threshold, notify admin
    IF current_count >= capacity_threshold THEN
      -- In a real implementation, you would call a notification function here
      -- This is a placeholder for the actual implementation
      RAISE NOTICE 'Event % is reaching capacity: % out of % spots filled', 
        event_record.title, current_count, event_record.max_attendees;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for capacity check
CREATE TRIGGER event_capacity_check
AFTER INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION check_event_capacity(); 