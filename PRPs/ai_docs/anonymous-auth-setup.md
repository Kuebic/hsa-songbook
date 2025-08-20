# Anonymous Authentication Setup Guide

## Overview
This guide documents the implementation of anonymous authentication in the HSA Songbook application using Supabase Auth with Cloudflare Turnstile protection.

## Implementation Summary

### 1. Code Changes Completed ✅
- Updated `useAuth` hook to support anonymous sign-in
- Added `signInAnonymously`, `linkEmailToAnonymousUser`, and `linkOAuthToAnonymousUser` methods
- Modified `EmailAuthForm` to include anonymous mode option
- Created `ConvertAnonymousUser` component for upgrading guest accounts
- Updated `UserMenu` to show upgrade option for anonymous users
- Added TypeScript types for anonymous user support

### 2. Supabase Dashboard Configuration Required

#### Enable Anonymous Sign-Ins
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Anonymous Sign-Ins** in the provider list
4. Toggle it ON to enable anonymous authentication

#### Configure Manual Linking (for account conversion)
1. In the Supabase Dashboard, go to **Authentication** → **Settings**
2. Under **Security Settings**, find **Manual Linking**
3. Enable manual linking to allow anonymous users to link email/OAuth accounts

#### Cloudflare Turnstile Configuration
1. In **Authentication** → **Settings** → **Captcha Protection**
2. Select **Cloudflare Turnstile** as the provider
3. Add your Turnstile secret key (for development use: `1x0000000000000000000000000000000AA`)
4. Enable captcha for anonymous sign-ins

### 3. RLS Policies for Anonymous Users

Add these policies to your Supabase database to distinguish between anonymous and permanent users:

```sql
-- Allow anonymous users to read public data
CREATE POLICY "Anonymous users can view songs"
ON songs FOR SELECT
TO authenticated
USING (true);

-- Only permanent users can create/edit songs
CREATE POLICY "Only permanent users can create songs"
ON songs AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

CREATE POLICY "Only permanent users can update songs"
ON songs AS RESTRICTIVE FOR UPDATE
TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

-- Allow anonymous users to create temporary setlists
CREATE POLICY "Anonymous users can create temporary setlists"
ON setlists FOR INSERT
TO authenticated
WITH CHECK (
  CASE 
    WHEN (SELECT (auth.jwt()->>'is_anonymous')::boolean) = true 
    THEN is_public = false -- Anonymous users can only create private setlists
    ELSE true
  END
);

-- Anonymous users can only view their own setlists
CREATE POLICY "Anonymous users view own setlists"
ON setlists FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_public = true
  OR (SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE
);

-- Users table policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 4. Environment Variables

Ensure these are set in your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here

# Cloudflare Turnstile (for production)
VITE_TURNSTILE_SITE_KEY=your-turnstile-sitekey

# For development, you can use test keys:
# VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

## User Flow

### Anonymous Sign-In
1. User clicks "Sign In" button
2. Selects "Continue as Guest" option
3. Completes Turnstile captcha verification
4. Creates anonymous session

### Converting Anonymous to Permanent Account

#### Via Email
1. Anonymous user clicks "Upgrade Account" in user menu
2. Selects "Convert with Email"
3. Enters email and optional password
4. If password provided: Account immediately upgraded
5. If no password: Email verification required first

#### Via OAuth
1. Anonymous user clicks "Upgrade Account"
2. Selects "Continue with Google/GitHub"
3. Completes OAuth flow
4. Account linked and upgraded

## Testing the Implementation

### Local Testing
1. Set test Turnstile keys in `.env`
2. Enable anonymous sign-ins in Supabase dashboard
3. Run `npm run dev`
4. Test anonymous sign-in flow
5. Test account conversion flow

### Production Considerations
1. Use real Cloudflare Turnstile keys
2. Implement cleanup job for old anonymous accounts:

```sql
-- Run periodically to clean up old anonymous accounts
DELETE FROM auth.users
WHERE is_anonymous = true 
AND created_at < NOW() - INTERVAL '30 days';
```

3. Monitor anonymous user creation rate for abuse
4. Consider implementing additional rate limiting

## Data Conflict Resolution

When converting anonymous users to permanent accounts, handle data conflicts:

```typescript
// Example: Merging setlists when converting account
async function mergeAnonymousData(anonymousUserId: string, permanentUserId: string) {
  // Transfer ownership of anonymous user's setlists
  await supabase
    .from('setlists')
    .update({ user_id: permanentUserId })
    .eq('user_id', anonymousUserId)
  
  // Handle any other data migrations needed
}
```

## Security Best Practices

1. **Always use Turnstile** for anonymous sign-ins to prevent abuse
2. **Implement RLS policies** to restrict anonymous user capabilities  
3. **Regular cleanup** of old anonymous accounts
4. **Monitor usage** for unusual patterns
5. **Rate limiting** at application level if needed

## Troubleshooting

### Common Issues

1. **"Anonymous sign-ins not working"**
   - Check if anonymous provider is enabled in Supabase
   - Verify Turnstile keys are configured correctly

2. **"Cannot convert anonymous account"**
   - Ensure manual linking is enabled in Supabase
   - Check if email already exists in system

3. **"RLS policy errors"**
   - Verify policies use RESTRICTIVE where needed
   - Check JWT claims include is_anonymous field

## Next Steps

1. Enable anonymous sign-ins in Supabase dashboard
2. Configure Turnstile protection
3. Apply RLS policies to database
4. Test full flow end-to-end
5. Set up monitoring and cleanup jobs