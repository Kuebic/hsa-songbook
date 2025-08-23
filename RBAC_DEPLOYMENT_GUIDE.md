# RBAC Deployment Guide for HSA Songbook

This guide explains how to deploy the Role-Based Access Control system to your online Supabase project.

## 🚀 Deployment Options

### Option A: Using PostgreSQL Function (Recommended for Simplicity)

**Note**: This option only works if Supabase has enabled the `pg-functions://` protocol for your project. Try this first.

1. **Run the SQL Script**
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and run the entire contents of `/supabase/migrations/rbac_setup_complete.sql`

2. **Enable the Auth Hook**
   - Go to Authentication → Hooks
   - Enable "Custom Access Token Hook"
   - Try setting the URI to: `pg-functions://postgres/public/custom_access_token_hook`
   - If this doesn't work (requires HTTPS), proceed to Option B

### Option B: Using Edge Function (For Cloud Supabase)

Since cloud Supabase requires HTTPS URLs for auth hooks, we need to deploy an Edge Function:

#### Step 1: Deploy the Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   npx supabase login
   ```

3. **Link your project**:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Settings → General)

4. **Deploy the Edge Function**:
   ```bash
   npx supabase functions deploy custom-access-token
   ```

5. **Get your Edge Function URL**:
   After deployment, your function will be available at:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/custom-access-token
   ```

#### Step 2: Run the SQL Script

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and run the entire contents of `/supabase/migrations/rbac_setup_complete.sql`

#### Step 3: Configure the Auth Hook

1. Go to **Authentication → Hooks** in your Supabase Dashboard
2. Enable **"Custom Access Token Hook"**
3. Set the URI to your Edge Function URL:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/custom-access-token
   ```

### Option C: Manual SQL Execution (Simplest, No Hook)

If you have issues with auth hooks, you can still use RBAC with manual token refresh:

1. **Run the SQL Script** (creates tables and functions)
2. **Skip the auth hook configuration**
3. **Use the `refreshRole` method** in your app when roles change:
   ```typescript
   // After role change, manually refresh
   const { refreshRole } = useRoles()
   await refreshRole()
   ```

## 📝 Make Yourself an Admin

After setting up, grant yourself admin access:

```sql
-- Replace with your email
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'your-email@example.com';
```

## ✅ Verify the Setup

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'role_audit_log');
```

### Check Your Role
```sql
SELECT u.email, ur.role, ur.is_active
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

### Test Role Assignment
```sql
-- Grant moderator role to someone
SELECT public.grant_user_role(
    (SELECT id FROM auth.users WHERE email = 'user@example.com'),
    'moderator',
    'Trusted community member'
);
```

## 🔧 Troubleshooting

### Auth Hook Not Working?

1. **Check Supabase Plan**: Some auth hook features may require a paid plan
2. **Verify Edge Function**: Check Logs → Edge Functions for errors
3. **Test Manually**: You can still use RBAC without hooks by manually refreshing tokens

### Role Not Appearing in JWT?

1. **Sign out and sign back in** - New tokens are needed
2. **Check role assignment** - Verify user has a role in `user_roles` table
3. **Check hook configuration** - Ensure the hook URL is correct

### Frontend Not Recognizing Roles?

1. **Clear browser storage** - Remove old tokens
2. **Check console for errors** - JWT decode errors will be logged
3. **Verify role in JWT** - Decode token at jwt.io to check claims

## 🎯 Quick Test

After setup, test in your browser console:

```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Decode and check token
if (session?.access_token) {
  // Copy token and decode at jwt.io
  console.log('Token:', session.access_token)
}
```

Look for these claims in the decoded token:
- `user_role`: Should be 'admin', 'moderator', or 'user'
- `can_moderate`: Boolean flag
- `can_admin`: Boolean flag

## 📚 Additional Resources

- [Supabase Auth Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)