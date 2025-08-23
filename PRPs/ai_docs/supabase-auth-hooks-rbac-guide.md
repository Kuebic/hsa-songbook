# Comprehensive Guide to Supabase Custom Access Token Auth Hooks for RBAC (2024-2025)

## Overview

Supabase Custom Access Token Hooks allow you to modify JWT tokens before they are issued, enabling sophisticated Role-Based Access Control (RBAC) implementations. This feature runs before token issuance and can add, remove, or modify claims in the JWT.

## 1. Configuration

### Cloud/Managed Supabase
Custom access token hooks are available in the Supabase Dashboard under Authentication > Hooks.

**Key URLs:**
- Main Auth Hooks Documentation: https://supabase.com/docs/guides/auth/auth-hooks
- Custom Access Token Hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- RBAC with Custom Claims: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

### Self-Hosted Configuration

#### Local Development (config.toml)
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

**Important:** After modifying config.toml, you must run `supabase stop` and `supabase start` - running `supabase db reset` alone will not activate the hook.

#### Docker Compose Configuration
Environment variables in `.env`:
```env
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"
```

Docker Compose service configuration:
```yaml
services:
  auth:
    environment:
      GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: ${GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED}
      GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI: ${GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI}
```

## 2. PostgreSQL Function Implementation

### Basic Structure
```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  -- declare other variables here
begin
  -- Extract existing claims
  claims := event->'claims';
  
  -- Modify claims based on your logic
  -- claims := jsonb_set(claims, '{custom_claim}', to_jsonb('value'));
  
  -- Update the event with modified claims
  event := jsonb_set(event, '{claims}', claims);
  
  return event;
end;
$$;
```

### Complete RBAC Example
```sql
-- Create enum types
create type public.app_permission as enum ('channels.delete', 'messages.delete');
create type public.app_role as enum ('admin', 'moderator');

-- Create role mapping table
create table public.user_roles (
  user_id uuid references auth.users on delete cascade,
  role app_role,
  primary key (user_id)
);

-- Create permissions table
create table public.role_permissions (
  role app_role,
  permission app_permission,
  primary key (role, permission)
);

-- Insert default permissions
insert into public.role_permissions (role, permission) values
  ('admin', 'channels.delete'),
  ('admin', 'messages.delete'),
  ('moderator', 'messages.delete');

-- Create the custom access token hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  -- Fetch the user role
  select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;
  
  claims := event->'claims';
  
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;
  
  event := jsonb_set(event, '{claims}', claims);
  
  return event;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant all on table public.user_roles to supabase_auth_admin;
grant all on table public.role_permissions to supabase_auth_admin;
```

### Authorization Helper Function
```sql
create or replace function public.authorize(requested_permission app_permission)
returns boolean as $$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  -- Extract role from JWT
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;
  
  -- Check if role has permission
  select count(*) into bind_permissions
  from public.role_permissions
  where role_permissions.permission = requested_permission
    and role_permissions.role = user_role;
    
  return bind_permissions > 0;
end;
$$ language plpgsql;
```

### RLS Policy Example
```sql
-- Example RLS policy using the authorize function
alter table messages enable row level security;

create policy "Users can delete messages if they have permission" on messages
  for delete using (authorize('messages.delete'));
```

## 3. Client-Side Implementation

### Accessing Custom Claims (JavaScript)
```javascript
import { jwtDecode } from 'jwt-decode'

// Get the current session
const { data: { session } } = await supabase.auth.getSession()

if (session?.access_token) {
  // Decode the JWT to access custom claims
  const payload = jwtDecode(session.access_token)
  const userRole = payload.user_role
  
  console.log('User role:', userRole)
}
```

### React Hook Example
```typescript
import { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { supabase } from './supabase'

interface CustomClaims {
  user_role?: string
  [key: string]: any
}

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token) {
        try {
          const payload = jwtDecode<CustomClaims>(session.access_token)
          setUserRole(payload.user_role || null)
        } catch (error) {
          console.error('Failed to decode JWT:', error)
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          try {
            const payload = jwtDecode<CustomClaims>(session.access_token)
            setUserRole(payload.user_role || null)
          } catch (error) {
            console.error('Failed to decode JWT:', error)
            setUserRole(null)
          }
        } else {
          setUserRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { userRole, loading }
}
```

## 4. Security Considerations & Best Practices

### Critical Security Requirements

1. **Required Claims Compliance**: Your function MUST return these claims:
   - `iss`, `aud`, `exp`, `iat`, `sub`, `role`, `aal`, `session_id`
   - `email`, `phone`, `is_anonymous`

2. **Permission Management**: 
```sql
-- Always grant proper permissions
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

3. **Avoid user_metadata in RLS**: Never use `user_metadata` in RLS policies as users can modify this data:
```sql
-- BAD: Users can modify user_metadata
create policy "bad_policy" on messages
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- GOOD: Use custom claims from auth hooks
create policy "good_policy" on messages  
  for select using (authorize('messages.read'));
```

4. **Use app_metadata for Authorization**: 
   - `user_metadata`: Can be updated by users - not suitable for authorization
   - `app_metadata`: Cannot be updated by users - suitable for authorization data

### 2024-2025 Security Updates

#### JWT Secret Removal (November 2024)
- `app.settings.jwt_secret` was removed from PostgreSQL database access
- Previously accessible via `current_setting('app.settings.jwt_secret')`
- This change prevents potential JWT secret exposure through database queries

#### Asymmetric Keys (May 2025)
- New projects will use asymmetric keys by default starting May 1, 2025
- Improves security by eliminating shared secret vulnerabilities
- Existing projects can opt-in before the mandatory transition

### Function Performance & Constraints

1. **Timeout Limits**:
   - PostgreSQL hooks: 2 seconds maximum execution time
   - HTTP hooks: 5 seconds maximum execution time
   - Both run in transactions to limit execution duration

2. **Avoid SECURITY DEFINER**:
```sql
-- AVOID: Security definer gives extensive postgres role permissions
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer  -- AVOID THIS
as $$
  -- function body
$$;

-- PREFER: Use stable functions with proper permissions
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable  -- PREFER THIS
as $$
  -- function body
$$;
```

## 5. Advanced Examples

### Access Restriction Hook
```sql
create or replace function public.restrict_application_access(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  authentication_method text;
  email_claim text;
  allowed_emails text[] := array['admin@company.com', 'manager@company.com'];
begin
  email_claim = event->'claims'->>'email';
  authentication_method = event->'authentication_method';
  
  -- Remove quotes from authentication method
  authentication_method = replace(authentication_method, '"', '');
  
  -- Allow company emails, SSO users, or specific emails
  if email_claim ilike '%@company.com' or 
     authentication_method = 'sso/saml' or 
     email_claim = any(allowed_emails) then
    return event;
  end if;
  
  -- Return error for unauthorized users
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Access restricted to company members. Please use your @company.com account.'
    )
  );
end;
$$;
```

### Multi-Tenant Organization Support
```sql
create table public.user_organizations (
  user_id uuid references auth.users on delete cascade,
  organization_id uuid,
  role text,
  primary key (user_id, organization_id)
);

create or replace function public.multi_tenant_access_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_orgs jsonb;
begin
  claims := event->'claims';
  
  -- Get user's organizations and roles
  select jsonb_agg(
    jsonb_build_object(
      'org_id', organization_id,
      'role', role
    )
  ) into user_orgs
  from public.user_organizations
  where user_id = (event->>'user_id')::uuid;
  
  -- Add organizations to claims
  claims := jsonb_set(claims, '{organizations}', coalesce(user_orgs, '[]'::jsonb));
  
  event := jsonb_set(event, '{claims}', claims);
  
  return event;
end;
$$;
```

## 6. Common Gotchas & Troubleshooting

### Local Development Issues
- **Hook not executing**: Ensure you run `supabase stop` then `supabase start` after config changes
- **Database reset doesn't activate hooks**: Must stop/start, not just reset
- **SQL Editor '?' operator**: Use direct database connection for JSON `?` operator in functions

### Production Deployment
- **Docker restart required**: After changing environment variables, restart containers
- **Permission errors**: Ensure supabase_auth_admin has access to your tables and functions
- **RLS policy conflicts**: Auth admin needs RLS policy exceptions for tables used in hooks

### JWT Token Issues
- **Claims not appearing**: Auth hooks only modify access_token, not auth response
- **Token refresh timing**: Role changes won't take effect until new token is issued
- **JWT size limits**: Large custom claims can cause token size issues

### Error Handling
```sql
-- Always include proper error handling
create or replace function public.safe_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  claims := event->'claims';
  
  begin
    -- Your logic here with potential for errors
    select role into user_role from public.user_roles 
    where user_id = (event->>'user_id')::uuid;
    
    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    end if;
    
  exception when others then
    -- Log error and continue with original claims
    raise log 'Error in access token hook: %', sqlerrm;
    -- Return original event on error to avoid blocking authentication
  end;
  
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;
```

## 7. Testing Your Implementation

### Test Hook Function Directly
```sql
-- Test your function with mock data
select public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'your-test-user-id',
    'claims', jsonb_build_object(
      'sub', 'your-test-user-id',
      'email', 'test@example.com',
      'role', 'authenticated'
      -- include other required claims
    )
  )
);
```

### Verify JWT Claims
```javascript
// In your application, log the decoded token
const { data: { session } } = await supabase.auth.getSession()
if (session?.access_token) {
  console.log('JWT Claims:', jwtDecode(session.access_token))
}
```

This comprehensive guide covers the latest 2024-2025 approaches to implementing RBAC with Supabase auth hooks, including security considerations, best practices, and common pitfalls to avoid.