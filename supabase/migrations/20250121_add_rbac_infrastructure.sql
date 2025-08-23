-- Migration: RBAC Infrastructure
-- Date: 2025-01-21
-- Description: Adds role-based access control with auth hooks, user roles table, and audit logging

-- Create enum for roles
CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- Audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    role user_role NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('grant', 'revoke', 'expire')),
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON public.role_audit_log(performed_at DESC);

-- Custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    user_role_value public.user_role;
BEGIN
    -- Extract existing claims
    claims := event->'claims';
    
    -- Get user's active role
    SELECT role INTO user_role_value
    FROM public.user_roles
    WHERE user_id = (event->>'user_id')::uuid
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;
    
    -- Add role to claims (default to 'user' if no role found)
    IF user_role_value IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role_value::text));
    ELSE
        claims := jsonb_set(claims, '{user_role}', '"user"');
        user_role_value := 'user';
    END IF;
    
    -- Add permission flags for convenience
    claims := jsonb_set(claims, '{can_moderate}', 
        to_jsonb(user_role_value IN ('admin', 'moderator')));
    claims := jsonb_set(claims, '{can_admin}', 
        to_jsonb(user_role_value = 'admin'));
    
    -- Update event with modified claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
EXCEPTION WHEN OTHERS THEN
    -- Log error and return original event to avoid blocking auth
    RAISE LOG 'Error in custom_access_token_hook: %', SQLERRM;
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT INSERT, UPDATE ON public.role_audit_log TO supabase_auth_admin;

-- Revoke public access
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- RLS Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own role
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Only admins can manage roles (will check JWT claim)
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- Audit log is read-only for admins
CREATE POLICY "Admins can view audit log" ON public.role_audit_log
    FOR SELECT USING (
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for RBAC';
COMMENT ON TABLE public.role_audit_log IS 'Audit trail for all role changes';
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Auth hook to add role claims to JWT';
COMMENT ON COLUMN public.user_roles.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN public.user_roles.role IS 'User role: admin, moderator, or user';
COMMENT ON COLUMN public.user_roles.granted_by IS 'Who granted this role';
COMMENT ON COLUMN public.user_roles.granted_at IS 'When the role was granted';
COMMENT ON COLUMN public.user_roles.expires_at IS 'Optional expiration time for temporary roles';
COMMENT ON COLUMN public.user_roles.is_active IS 'Whether this role assignment is currently active';
COMMENT ON COLUMN public.role_audit_log.action IS 'Type of action: grant, revoke, or expire';
COMMENT ON COLUMN public.role_audit_log.reason IS 'Optional reason for the role change';
COMMENT ON COLUMN public.role_audit_log.metadata IS 'Additional metadata about the role change';