-- Migration: Add INSERT policy for users table
-- Description: Allows authenticated users to create their own profile on first login
-- Author: HSA Songbook Team  
-- Date: 2025-08-26
-- Issue: RLS policy violation preventing user sync on first login

BEGIN;

-- Add INSERT policy for users table
-- This allows authenticated users to create their own profile record
CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Note: The existing UPDATE policy already handles updates properly

COMMIT;