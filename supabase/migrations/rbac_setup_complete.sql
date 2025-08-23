-- RBAC Infrastructure Setup for HSA Songbook
-- Run this script in your Supabase SQL Editor (online dashboard)
-- This creates the complete RBAC system with auth hooks
-- Compatible with existing database schema

-- ============================================
-- IMPORTANT: This script is designed to work with
-- the existing HSA Songbook database that already has:
-- - public.users table (for user profiles)
-- - auth.users table (Supabase auth)
-- - songs, arrangements, setlists, reviews tables
-- ============================================

-- ============================================
-- STEP 1: Create Role Enum
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

-- ============================================
-- STEP 2: Create User Roles Table
-- ============================================
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

-- ============================================
-- STEP 3: Create Audit Log Table
-- ============================================
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

-- ============================================
-- STEP 4: Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON public.role_audit_log(performed_at DESC);

-- ============================================
-- STEP 5: Grant Necessary Permissions for Tables
-- ============================================
-- Note: We're using an Edge Function for the auth hook, not a PostgreSQL function
-- The Edge Function will use the service role key to bypass RLS

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT INSERT, UPDATE ON public.role_audit_log TO supabase_auth_admin;

-- ============================================
-- STEP 7: Enable Row Level Security
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 8: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.role_audit_log;

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

-- ============================================
-- STEP 9: Add Documentation Comments
-- ============================================
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

-- ============================================
-- STEP 10: Helper Functions for Role Management
-- ============================================

-- Function to grant a role to a user
CREATE OR REPLACE FUNCTION public.grant_user_role(
    target_user_id UUID,
    new_role user_role,
    grant_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    granting_user_id UUID;
    granting_user_role TEXT;
BEGIN
    -- Get the current user's ID and role
    granting_user_id := auth.uid();
    granting_user_role := auth.jwt() ->> 'user_role';
    
    -- Check if the granting user is an admin
    IF granting_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can grant roles';
    END IF;
    
    -- Upsert the role assignment
    INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active)
    VALUES (target_user_id, new_role, granting_user_id, NOW(), true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        granted_by = EXCLUDED.granted_by,
        granted_at = EXCLUDED.granted_at,
        is_active = true;
    
    -- Log the action
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, reason)
    VALUES (target_user_id, new_role, 'grant', granting_user_id, grant_reason);
    
    RETURN true;
END;
$$;

-- Function to revoke a user's role
CREATE OR REPLACE FUNCTION public.revoke_user_role(
    target_user_id UUID,
    revoke_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    granting_user_id UUID;
    granting_user_role TEXT;
    current_role user_role;
BEGIN
    -- Get the current user's ID and role
    granting_user_id := auth.uid();
    granting_user_role := auth.jwt() ->> 'user_role';
    
    -- Check if the granting user is an admin
    IF granting_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can revoke roles';
    END IF;
    
    -- Get the current role before revoking
    SELECT role INTO current_role
    FROM public.user_roles
    WHERE user_id = target_user_id AND is_active = true;
    
    -- Deactivate the role
    UPDATE public.user_roles
    SET is_active = false
    WHERE user_id = target_user_id;
    
    -- Log the action
    IF current_role IS NOT NULL THEN
        INSERT INTO public.role_audit_log (user_id, role, action, performed_by, reason)
        VALUES (target_user_id, current_role, 'revoke', granting_user_id, revoke_reason);
    END IF;
    
    RETURN true;
END;
$$;

-- ============================================
-- STEP 11: Initial Admin Setup (Optional)
-- ============================================
-- IMPORTANT: After running this script, you need to:
-- 1. Go to Authentication > Hooks in your Supabase Dashboard
-- 2. Enable "Custom Access Token Hook"
-- 3. Set the URI to: pg-functions://postgres/public/custom_access_token_hook
--
-- To make yourself an admin, uncomment and modify the following:
-- INSERT INTO public.user_roles (user_id, role, is_active)
-- SELECT id, 'admin', true
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup:

-- Check if tables were created
SELECT 'user_roles table' as component, 
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'user_roles') as exists;

SELECT 'role_audit_log table' as component,
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'role_audit_log') as exists;

-- Check if the enum type was created
SELECT 'user_role enum type' as component,
       EXISTS(SELECT 1 FROM pg_type 
              WHERE typname = 'user_role') as exists;

-- Check if helper functions were created (for PostgreSQL function approach)
SELECT 'grant_user_role function' as component,
       EXISTS(SELECT 1 FROM pg_proc 
              WHERE proname = 'grant_user_role') as exists;

SELECT 'revoke_user_role function' as component,
       EXISTS(SELECT 1 FROM pg_proc 
              WHERE proname = 'revoke_user_role') as exists;

-- NOTE: If using Edge Function approach, the custom_access_token_hook 
-- PostgreSQL function won't exist. Instead, verify your Edge Function at:
-- https://YOUR-PROJECT-REF.supabase.co/functions/v1/custom-access-token

-- View current role assignments (if any)
SELECT u.email, ur.role, ur.is_active, ur.granted_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.granted_at DESC;