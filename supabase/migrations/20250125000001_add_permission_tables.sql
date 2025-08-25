-- Migration: Add Permission System Tables
-- Description: Creates tables for fine-grained permission management (RBAC)
-- Author: HSA Songbook Team
-- Date: 2025-01-25

BEGIN;

-- ==========================================
-- PERMISSIONS TABLE
-- Core permission definitions for RBAC system
-- ==========================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,  -- 'songs', 'arrangements', 'users', 'setlists', etc.
  action TEXT NOT NULL,    -- 'create', 'read', 'update', 'delete', 'moderate', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Add comments for documentation
COMMENT ON TABLE public.permissions IS 'Core permission definitions for the RBAC system';
COMMENT ON COLUMN public.permissions.resource IS 'Resource type that this permission applies to';
COMMENT ON COLUMN public.permissions.action IS 'Action that can be performed on the resource';

-- ==========================================
-- CUSTOM ROLES TABLE
-- Custom roles with specific permission sets
-- ==========================================
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,  -- Array of permission IDs
  is_system BOOLEAN DEFAULT false,        -- Prevent deletion of system roles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add comments for documentation
COMMENT ON TABLE public.custom_roles IS 'Custom roles that can be created and assigned to users';
COMMENT ON COLUMN public.custom_roles.permissions IS 'Array of permission IDs assigned to this role';
COMMENT ON COLUMN public.custom_roles.is_system IS 'Flag to prevent deletion of built-in system roles';

-- ==========================================
-- PERMISSION GROUPS TABLE
-- Groups of related permissions for easier management
-- ==========================================
CREATE TABLE IF NOT EXISTS public.permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions UUID[] DEFAULT ARRAY[]::UUID[],  -- Array of permission IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.permission_groups IS 'Groups of related permissions for easier management';
COMMENT ON COLUMN public.permission_groups.permissions IS 'Array of permission IDs in this group';

-- ==========================================
-- USER PERMISSIONS TABLE
-- Direct permission assignments to users (overrides role permissions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- Optional expiration for temporary permissions
  UNIQUE(user_id, permission_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.user_permissions IS 'Direct permission assignments to users';
COMMENT ON COLUMN public.user_permissions.expires_at IS 'Optional expiration timestamp for temporary permissions';

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
  ON public.user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id 
  ON public.user_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_expires 
  ON public.user_permissions(expires_at) 
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_roles_created_by 
  ON public.custom_roles(created_by) 
  WHERE created_by IS NOT NULL;

-- GIN index for JSONB permissions array in custom_roles
CREATE INDEX IF NOT EXISTS idx_custom_roles_permissions 
  ON public.custom_roles USING GIN(permissions);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all permission tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions table policies
CREATE POLICY "permissions_select_authenticated" 
  ON public.permissions FOR SELECT 
  TO authenticated
  USING (true);

-- Custom roles policies
CREATE POLICY "custom_roles_select_all" 
  ON public.custom_roles FOR SELECT 
  USING (true);

CREATE POLICY "custom_roles_insert_admin" 
  ON public.custom_roles FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

CREATE POLICY "custom_roles_update_admin" 
  ON public.custom_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

CREATE POLICY "custom_roles_delete_admin" 
  ON public.custom_roles FOR DELETE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Permission groups policies
CREATE POLICY "permission_groups_select_authenticated" 
  ON public.permission_groups FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "permission_groups_manage_admin" 
  ON public.permission_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- User permissions policies
CREATE POLICY "user_permissions_select_own" 
  ON public.user_permissions FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_permissions_select_admin" 
  ON public.user_permissions FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "user_permissions_manage_admin" 
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- ==========================================
-- UPDATE TRIGGERS
-- ==========================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permission_groups_updated_at
  BEFORE UPDATE ON public.permission_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- DEFAULT PERMISSION DATA
-- ==========================================

-- Insert default permissions
INSERT INTO public.permissions (resource, action, description) VALUES
  ('songs', 'create', 'Create new songs'),
  ('songs', 'read', 'View songs'),
  ('songs', 'update', 'Edit existing songs'),
  ('songs', 'delete', 'Delete songs'),
  ('songs', 'moderate', 'Moderate song submissions'),
  ('arrangements', 'create', 'Create new arrangements'),
  ('arrangements', 'read', 'View arrangements'),
  ('arrangements', 'update', 'Edit existing arrangements'),
  ('arrangements', 'delete', 'Delete arrangements'),
  ('arrangements', 'moderate', 'Moderate arrangement submissions'),
  ('setlists', 'create', 'Create new setlists'),
  ('setlists', 'read', 'View setlists'),
  ('setlists', 'update', 'Edit existing setlists'),
  ('setlists', 'delete', 'Delete setlists'),
  ('setlists', 'share', 'Share setlists with others'),
  ('users', 'read', 'View user profiles'),
  ('users', 'update', 'Edit user profiles'),
  ('users', 'delete', 'Delete user accounts'),
  ('users', 'moderate', 'Moderate user accounts'),
  ('permissions', 'manage', 'Manage permissions and roles'),
  ('reports', 'view', 'View content reports'),
  ('reports', 'resolve', 'Resolve content reports'),
  ('*', '*', 'Full system access (admin only)')
ON CONFLICT (resource, action) DO NOTHING;

-- Insert default permission groups
INSERT INTO public.permission_groups (name, description) VALUES
  ('song_management', 'Permissions for managing songs'),
  ('arrangement_management', 'Permissions for managing arrangements'),
  ('setlist_management', 'Permissions for managing setlists'),
  ('moderation', 'Permissions for content moderation'),
  ('user_management', 'Permissions for managing users'),
  ('system_administration', 'Full system administration permissions')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions to the application
GRANT ALL ON public.permissions TO authenticated;
GRANT ALL ON public.custom_roles TO authenticated;
GRANT ALL ON public.permission_groups TO authenticated;
GRANT ALL ON public.user_permissions TO authenticated;
GRANT SELECT ON public.permissions TO anon;
GRANT SELECT ON public.custom_roles TO anon;

COMMIT;