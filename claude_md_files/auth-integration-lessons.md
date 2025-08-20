# Authentication Integration Lessons: Supabase + PostgreSQL

This document captures key learnings from implementing authentication with Supabase, focusing on common patterns and best practices for the HSA Songbook project.

## Core Architecture: Supabase Auth

### Current Implementation
- **Authentication Provider**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **User IDs**: UUIDs (PostgreSQL native)
- **Session Management**: JWT tokens via Supabase client

### Authentication Flow
```
Frontend (React) → Supabase Auth → PostgreSQL Database
User login      → JWT token     → UUID references
```

## Key Implementation Patterns

### User Table Synchronization
```typescript
// Sync Supabase Auth user to custom users table
const syncUserData = async (user: User) => {
  const userData = {
    id: user.id,  // UUID from auth.users
    email: user.email,
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
    // Additional profile fields
  }
  
  await supabase
    .from('users')
    .upsert(userData, { onConflict: 'id' })
}
```

### Row Level Security (RLS)
```sql
-- Only authenticated users can create content
CREATE POLICY "Users can create songs" ON songs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only edit their own content
CREATE POLICY "Users can update own songs" ON songs
  FOR UPDATE USING (created_by = auth.uid());
```

## Common Patterns & Solutions

### 1. User Reference Pattern
```sql
-- PostgreSQL schema with UUID references
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id),
  -- User ID is UUID, matches Supabase auth.users
);
```

### 2. Authentication Hook Pattern
```typescript
// Custom useAuth hook wrapping Supabase
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoaded: false,
    isSignedIn: false
  })
  
  useEffect(() => {
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user || null,
          session,
          isLoaded: true,
          isSignedIn: !!session
        })
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return authState
}
```

### 3. Protected API Routes
```typescript
// Middleware to verify authentication
export async function requireAuth(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No authorization token')
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid token')
  }
  
  return user
}
```

## Best Practices

### 1. Always Use UUIDs
- PostgreSQL native UUID type
- Matches Supabase auth.users.id
- No conversion needed between auth and database

### 2. Leverage RLS Policies
- Security at database level
- Automatic user context via auth.uid()
- No need to pass user IDs in queries

### 3. Handle Auth State Changes
```typescript
// Listen for auth changes globally
supabase.auth.onAuthStateChange((event, session) => {
  switch(event) {
    case 'SIGNED_IN':
      // Sync user data, redirect
      break
    case 'SIGNED_OUT':
      // Clear local state
      break
    case 'TOKEN_REFRESHED':
      // Update stored token
      break
  }
})
```

### 4. Error Handling
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    // Handle specific error codes
    switch(error.message) {
      case 'Invalid login credentials':
        // Show user-friendly message
        break
      case 'Email not confirmed':
        // Prompt for email verification
        break
    }
  }
} catch (err) {
  // Network or unexpected errors
}
```

## Future Enhancements

### Anonymous Authentication (Planned)
```typescript
// Allow guests to use app without account
const { data, error } = await supabase.auth.signInAnonymously()

// Later convert to permanent account
const { data: updateData } = await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'password'
})
```

### Social Authentication Expansion
- Currently: Email/password, Google, GitHub
- Planned: Facebook, Apple, Microsoft

### Session Persistence
- Current: Browser session storage
- Planned: Remember me option with refresh tokens

## Migration Considerations

### From Other Auth Providers
1. Map user IDs to UUIDs
2. Migrate user metadata to users table
3. Update foreign key references
4. Implement RLS policies

### Database Migrations
```sql
-- Example: Add new auth provider
ALTER TABLE users 
ADD COLUMN provider VARCHAR(50) DEFAULT 'email';

-- Track multiple auth methods
CREATE TABLE user_identities (
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50),
  provider_id TEXT,
  PRIMARY KEY (user_id, provider)
);
```

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Enable RLS on all tables
- ✅ Validate permissions server-side
- ✅ Store sensitive config in environment variables
- ✅ Implement rate limiting on auth endpoints
- ✅ Use secure session storage
- ✅ Regular security audits of RLS policies

## Common Pitfalls to Avoid

1. **Don't trust client-side user IDs** - Always verify via auth token
2. **Don't bypass RLS** - Use service role keys sparingly
3. **Don't store passwords** - Let Supabase handle auth
4. **Don't expose sensitive user data** - Use views with limited columns
5. **Don't forget email verification** - Enable in Supabase dashboard

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JWT Best Practices](https://supabase.com/docs/guides/auth/jwts)

This architecture provides a secure, scalable authentication system that integrates seamlessly with PostgreSQL's powerful features.