-- Enhance roles system with more granular permissions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create a roles reference table with descriptions
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rank INTEGER NOT NULL, -- Higher rank means more privileges
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a permissions table to define capabilities
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a junction table for roles and permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

-- Insert default roles
INSERT INTO public.roles (id, name, description, rank) VALUES
('superadmin', 'Super Administrator', 'Complete control over the platform, can manage other admins and system settings', 100),
('admin', 'Administrator', 'Can approve user role requests and manage all content/users', 80),
('moderator', 'Content Moderator', 'Can approve articles and manage content', 60),
('author', 'Featured Author', 'Can publish articles without approval', 40),
('contributor', 'Contributor', 'Can submit articles for approval', 20),
('user', 'Regular User', 'Basic access to platform features', 10)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, rank = EXCLUDED.rank;

-- Insert default permissions
INSERT INTO public.permissions (id, name, description) VALUES
('manage_roles', 'Manage Roles', 'Can assign and modify user roles'),
('manage_users', 'Manage Users', 'Can view and edit user profiles'),
('manage_system', 'Manage System', 'Can modify system settings and configurations'),
('approve_articles', 'Approve Articles', 'Can review and approve submitted articles'),
('publish_articles', 'Publish Articles', 'Can publish articles without review'),
('edit_any_article', 'Edit Any Article', 'Can edit articles by other users'),
('create_article', 'Create Article', 'Can create new articles'),
('manage_series', 'Manage Series', 'Can create and update series/collections'),
('manage_tags', 'Manage Tags', 'Can create and update tags')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
-- Superadmin has all permissions
('superadmin', 'manage_roles'),
('superadmin', 'manage_users'),
('superadmin', 'manage_system'),
('superadmin', 'approve_articles'),
('superadmin', 'publish_articles'),
('superadmin', 'edit_any_article'),
('superadmin', 'create_article'),
('superadmin', 'manage_series'),
('superadmin', 'manage_tags'),

-- Admin permissions
('admin', 'manage_roles'),
('admin', 'manage_users'),
('admin', 'approve_articles'),
('admin', 'publish_articles'),
('admin', 'edit_any_article'),
('admin', 'create_article'),
('admin', 'manage_series'),
('admin', 'manage_tags'),

-- Moderator permissions
('moderator', 'approve_articles'),
('moderator', 'create_article'),
('moderator', 'manage_series'),
('moderator', 'manage_tags'),

-- Author permissions
('author', 'publish_articles'),
('author', 'create_article'),
('author', 'manage_series'),

-- Contributor permissions
('contributor', 'create_article'),

-- Regular user has no special permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Modify the admin_requests table to allow specifying which role is being requested
ALTER TABLE public.admin_requests ADD COLUMN IF NOT EXISTS requested_role TEXT DEFAULT 'moderator';

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  -- Check if the user's role has the required permission
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    WHERE rp.role_id = user_role 
    AND rp.permission_id = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the admin request trigger to handle different role requests
CREATE OR REPLACE FUNCTION public.handle_admin_request_review()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    NEW.reviewed_at = now();
    
    -- If approved, update the user's role
    IF NEW.status = 'approved' THEN
      UPDATE public.profiles
      SET role = COALESCE(NEW.requested_role, 'moderator')
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 