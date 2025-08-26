-- Migration: Fix infinite recursion in user_roles RLS policies
-- Description: Fixes the infinite recursion caused by RLS policies that check the same table
-- Author: HSA Songbook Team  
-- Date: 2025-08-26
-- Issue: Policies checking for admin status within user_roles table cause infinite recursion

BEGIN;

-- Drop all existing user_roles policies to start fresh
DROP POLICY IF EXISTS "User roles viewable by admins" ON public.user_roles;
DROP POLICY IF EXISTS "User can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_read" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_read_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;

-- Create a security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    is_admin_user BOOLEAN;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Direct query without RLS since this is SECURITY DEFINER
    SELECT EXISTS(
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = target_user_id 
        AND role = 'admin' 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_admin_user;
    
    RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Create a similar function for moderator status
CREATE OR REPLACE FUNCTION public.is_moderator(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    is_mod_user BOOLEAN;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Direct query without RLS since this is SECURITY DEFINER
    SELECT EXISTS(
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = target_user_id 
        AND role IN ('moderator', 'admin') 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_mod_user;
    
    RETURN is_mod_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_moderator(UUID) TO authenticated;

-- Now create non-recursive policies using the helper functions

-- Users can view their own roles
CREATE POLICY "user_roles_own_read" 
    ON public.user_roles FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all roles (using the helper function to avoid recursion)
CREATE POLICY "user_roles_admin_read_all" 
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can insert new roles
CREATE POLICY "user_roles_admin_insert" 
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update any roles
CREATE POLICY "user_roles_admin_update" 
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can delete any roles
CREATE POLICY "user_roles_admin_delete" 
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Update other policies that might use the same pattern
-- Fix songs table policies if they use recursive checks
DROP POLICY IF EXISTS "songs_moderator_read_all" ON public.songs;
DROP POLICY IF EXISTS "songs_moderator_update" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_delete" ON public.songs;

-- Recreate with helper functions
CREATE POLICY "songs_moderator_read_all" 
    ON public.songs FOR SELECT
    TO authenticated
    USING (public.is_moderator());

CREATE POLICY "songs_moderator_update" 
    ON public.songs FOR UPDATE
    TO authenticated
    USING (public.is_moderator());

CREATE POLICY "songs_admin_delete" 
    ON public.songs FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Fix arrangements table policies
DROP POLICY IF EXISTS "arrangements_moderator_all" ON public.arrangements;

CREATE POLICY "arrangements_moderator_all" 
    ON public.arrangements FOR ALL
    TO authenticated
    USING (public.is_moderator());

COMMIT;