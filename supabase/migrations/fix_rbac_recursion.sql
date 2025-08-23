-- Fix RLS infinite recursion in user_roles table
-- Date: 2025-01-23
-- Issue: Circular dependency between RLS policies and JWT claims

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.role_audit_log;

-- Create safer RLS policies that don't create circular dependencies

-- 1. Users can always see their own role (no JWT dependency)
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- 2. Drop any existing is_admin functions to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- 3. For admin operations, use a security definer function instead of direct RLS
-- This bypasses RLS for admin operations and prevents recursion
CREATE OR REPLACE FUNCTION public.check_admin_role(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs with elevated privileges, bypassing RLS
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Direct query without RLS interference
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_id_param
          AND role = 'admin'
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
    );
EXCEPTION WHEN OTHERS THEN
    -- Return false on any error to fail safely
    RETURN false;
END;
$$;

-- 4. Create policy using the security definer function
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.check_admin_role());

-- 5. Similar approach for audit log
CREATE POLICY "Admins can view audit log" ON public.role_audit_log
    FOR SELECT USING (public.check_admin_role());

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_admin_role TO authenticated;

-- Ensure the auth hook still has direct access (bypassing RLS)
GRANT SELECT ON public.user_roles TO supabase_auth_admin;

-- Comments
COMMENT ON FUNCTION public.check_admin_role IS 'Security definer function to check admin role without RLS recursion';