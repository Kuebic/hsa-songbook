# Manual Database Setup Instructions

If you cannot run the `setup-database.sh` script (e.g., no psql installed), follow these manual steps:

## Prerequisites
- Access to your Supabase Dashboard
- Admin privileges on your Supabase project

## Setup Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Apply Database Migrations

Apply each SQL file in order by copying its contents and running in the SQL editor:

#### Step 1: Base Schema
1. Copy the entire contents of `database-schema.sql`
2. Paste into SQL Editor
3. Click **Run** (or press Ctrl/Cmd + Enter)
4. Wait for "Success" message

#### Step 2: Function Security Fixes
1. Copy the entire contents of `fix-function-security.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Wait for "Success" message

#### Step 3: View Security Fixes
1. Copy the entire contents of `fix-view-security.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Wait for "Success" message

#### Step 4: User RLS Policy Fixes (CRITICAL)
1. Copy the entire contents of `fix-users-rls-policy.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Wait for "Success" message

### 3. Verify Setup

Run this query to verify the RLS policies are correctly set up:

```sql
-- Check users table RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see 4 policies:
- `Users can create their own profile` (INSERT)
- `Users can view all profiles` (SELECT)
- `Users can update their own profile` (UPDATE)
- `Users can delete their own profile` (DELETE)

### 4. Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try to sign up with a new email address

3. Check the browser console for any errors

4. If successful, you should see:
   - "User data synced successfully" in the console
   - No RLS policy errors

## Troubleshooting

### If you still get RLS policy errors:

1. **Check Auth Settings**
   - Go to Authentication > Settings in Supabase
   - Ensure "Enable email confirmations" is set appropriately
   - Check Captcha settings match your environment

2. **Verify User ID Matching**
   Run this query to check if auth.uid() is working:
   ```sql
   SELECT auth.uid();
   ```
   This should return NULL if not authenticated, or a UUID if authenticated.

3. **Clear and Retry**
   If user data is corrupted, clear it:
   ```sql
   -- BE CAREFUL: This deletes all user data
   TRUNCATE TABLE users CASCADE;
   ```

4. **Check Logs**
   - Go to Logs > Postgres in Supabase Dashboard
   - Filter for errors related to "users" table
   - Look for specific RLS policy violations

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "new row violates row-level security policy" | Run `fix-users-rls-policy.sql` again |
| "Invalid login credentials" | Check email/password, verify account exists |
| "Email confirmation required" | Check email for confirmation link |
| Captcha errors | Configure Turnstile in Supabase Auth settings |
| User sync fails silently | Check browser console for detailed errors |

## Next Steps

After successful setup:
1. Users can sign up and sign in
2. User profiles are automatically created/synced
3. You can start building features that require authentication

For production:
1. Review and tighten RLS policies as needed
2. Add proper Captcha keys (not test keys)
3. Configure email templates in Supabase
4. Set up proper backup procedures