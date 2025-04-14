-- Add process_role_request function for handling admin requests in a transaction
CREATE OR REPLACE FUNCTION public.process_role_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_status TEXT,
  p_feedback TEXT,
  p_requested_role TEXT,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Validate inputs
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Status must be either "approved" or "rejected"';
  END IF;
  
  -- Update the admin request
  UPDATE public.admin_requests
  SET 
    status = p_status,
    reviewed_at = NOW(),
    reviewed_by = p_admin_id,
    feedback = p_feedback
  WHERE id = p_request_id;
  
  -- If approved, update the user's role
  IF p_status = 'approved' THEN
    UPDATE public.profiles
    SET role = p_requested_role
    WHERE id = p_user_id;
    
    -- Log the role change in an audit log if needed
    -- This is optional but recommended for auditing purposes
    -- INSERT INTO public.role_change_logs (user_id, previous_role, new_role, changed_by)
    -- VALUES (p_user_id, (SELECT role FROM public.profiles WHERE id = p_user_id), p_requested_role, p_admin_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION public.process_role_request IS 
'Processes an admin role request in a transaction, updating the request status and user role if approved.';

-- Grant execute permission to authenticated users (the API will handle authorization)
GRANT EXECUTE ON FUNCTION public.process_role_request TO authenticated; 