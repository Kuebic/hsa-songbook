# 💡 Common Development Workflows

This guide provides step-by-step workflows for common development tasks in the HSA Songbook project.

## Table of Contents

- [Adding a New Feature](#adding-a-new-feature)
- [Creating a Database Migration](#creating-a-database-migration)
- [Testing with Seed Data](#testing-with-seed-data)
- [Debugging Database Issues](#debugging-database-issues)
- [Implementing Authentication](#implementing-authentication)
- [Performance Optimization](#performance-optimization)
- [Deployment Preparation](#deployment-preparation)

---

## Adding a New Feature

Complete workflow for implementing a new feature from database to UI.

### Prerequisites
- Local development environment running (`npm run dev`)
- Supabase local instance active (`npm run supabase:status`)
- Feature requirements documented

### Step-by-Step Instructions

1. **Plan the Feature Architecture**
   ```bash
   # Create feature directory structure
   mkdir -p src/features/my-feature/{components,hooks,services,types,validation}
   mkdir -p src/features/my-feature/{pages,utils,stores}
   
   # Document the feature
   touch PRPs/my-feature-prd.md
   ```

2. **Design Database Schema**
   ```bash
   # Create new migration
   supabase migration new add_my_feature_table
   
   # Edit the migration file in supabase/migrations/
   code supabase/migrations/$(ls -t supabase/migrations/ | head -1)
   ```

3. **Apply Migration and Generate Types**
   ```bash
   # Apply migration locally
   npm run db:migrate
   
   # Generate TypeScript types
   npm run types:generate
   
   # Verify migration worked
   supabase db shell
   # In psql: \dt to list tables
   ```

4. **Create API Service Layer**
   ```typescript
   // src/features/my-feature/services/myFeatureService.ts
   import { supabase } from '@lib/supabase'
   import type { MyFeature } from '../types'
   
   export const myFeatureService = {
     async getAll() {
       const { data, error } = await supabase
         .from('my_features')
         .select('*')
       if (error) throw error
       return data
     },
     
     async create(feature: Omit<MyFeature, 'id' | 'created_at'>) {
       const { data, error } = await supabase
         .from('my_features')
         .insert(feature)
         .select()
         .single()
       if (error) throw error
       return data
     }
   }
   ```

5. **Implement React Query Hooks**
   ```typescript
   // src/features/my-feature/hooks/useMyFeature.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { myFeatureService } from '../services/myFeatureService'
   
   export const useMyFeatures = () => {
     return useQuery({
       queryKey: ['my-features'],
       queryFn: myFeatureService.getAll
     })
   }
   
   export const useCreateMyFeature = () => {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: myFeatureService.create,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['my-features'] })
       }
     })
   }
   ```

6. **Create TypeScript Types**
   ```typescript
   // src/features/my-feature/types/index.ts
   import type { Database } from '@lib/database.types'
   
   export type MyFeature = Database['public']['Tables']['my_features']['Row']
   export type NewMyFeature = Database['public']['Tables']['my_features']['Insert']
   export type UpdateMyFeature = Database['public']['Tables']['my_features']['Update']
   ```

7. **Add Validation Schemas**
   ```typescript
   // src/features/my-feature/validation/schemas.ts
   import { z } from 'zod'
   
   export const myFeatureSchema = z.object({
     name: z.string().min(1, 'Name is required').max(100),
     description: z.string().optional(),
     is_active: z.boolean().default(true)
   })
   
   export type MyFeatureFormData = z.infer<typeof myFeatureSchema>
   ```

8. **Build React Components**
   ```typescript
   // src/features/my-feature/components/MyFeatureList.tsx
   import { useMyFeatures } from '../hooks/useMyFeature'
   
   export const MyFeatureList = () => {
     const { data: features, isLoading, error } = useMyFeatures()
     
     if (isLoading) return <div>Loading...</div>
     if (error) return <div>Error: {error.message}</div>
     
     return (
       <ul>
         {features?.map(feature => (
           <li key={feature.id}>{feature.name}</li>
         ))}
       </ul>
     )
   }
   ```

9. **Add Routing and Pages**
   ```typescript
   // src/features/my-feature/pages/MyFeaturePage.tsx
   import { MyFeatureList } from '../components/MyFeatureList'
   
   export const MyFeaturePage = () => {
     return (
       <div>
         <h1>My Feature</h1>
         <MyFeatureList />
       </div>
     )
   }
   
   // Add route to src/app/App.tsx
   ```

10. **Write Tests**
    ```bash
    # Create test files
    mkdir -p src/features/my-feature/__tests__
    touch src/features/my-feature/__tests__/MyFeatureList.test.tsx
    
    # Run tests
    npm run test src/features/my-feature
    ```

11. **Update Feature Index**
    ```typescript
    // src/features/my-feature/index.ts
    export { MyFeatureList } from './components/MyFeatureList'
    export { MyFeaturePage } from './pages/MyFeaturePage'
    export { useMyFeatures, useCreateMyFeature } from './hooks/useMyFeature'
    export type { MyFeature, NewMyFeature } from './types'
    ```

### Commands to Run
```bash
# Complete feature development cycle
supabase migration new add_my_feature
npm run db:migrate
npm run types:generate
npm run dev  # Test in development
npm run test  # Run tests
npm run lint  # Check code quality
npm run build  # Verify production build
```

### Common Pitfalls
- **Forgetting to regenerate types** after database changes
- **Not handling loading and error states** in components
- **Missing validation** on both client and server side
- **Skipping tests** for complex business logic

### Verification Steps
1. ✅ Migration applied successfully
2. ✅ Types generated and imported correctly
3. ✅ Service functions work in isolation
4. ✅ React components render without errors
5. ✅ Data loads and updates correctly
6. ✅ Tests pass
7. ✅ Production build succeeds

---

## Creating a Database Migration

Workflow for safe schema changes using Supabase migrations.

### Prerequisites
- Understanding of the current schema
- Clear requirements for schema changes
- Supabase CLI installed and connected

### Step-by-Step Instructions

1. **Create Migration File**
   ```bash
   # Create descriptive migration name
   supabase migration new add_user_preferences_table
   # or
   supabase migration new alter_songs_add_duration_column
   ```

2. **Write Migration SQL**
   ```sql
   -- supabase/migrations/[timestamp]_add_user_preferences_table.sql
   BEGIN;
   
   -- Create the table
   CREATE TABLE IF NOT EXISTS public.user_preferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
     font_size INTEGER DEFAULT 14 CHECK (font_size BETWEEN 10 AND 24),
     auto_transpose BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     
     UNIQUE(user_id)
   );
   
   -- Enable RLS
   ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own preferences" 
     ON public.user_preferences FOR SELECT 
     TO authenticated
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own preferences" 
     ON public.user_preferences FOR UPDATE
     TO authenticated
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own preferences" 
     ON public.user_preferences FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() = user_id);
   
   -- Create indexes
   CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
   
   -- Create updated_at trigger
   CREATE TRIGGER trigger_user_preferences_updated_at
     BEFORE UPDATE ON public.user_preferences
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   
   COMMIT;
   ```

3. **Test Migration Locally**
   ```bash
   # Apply migration
   npm run db:migrate
   
   # Verify schema
   supabase db shell
   # In psql:
   \dt  # List tables
   \d user_preferences  # Describe table
   
   # Test policies
   SELECT * FROM user_preferences;  # Should work
   ```

4. **Generate Updated Types**
   ```bash
   npm run types:generate
   ```

5. **Create Migration Test**
   ```bash
   # Create test migration script
   touch scripts/test-user-preferences-migration.sh
   chmod +x scripts/test-user-preferences-migration.sh
   ```

   ```bash
   #!/bin/bash
   # scripts/test-user-preferences-migration.sh
   
   set -e
   
   echo "Testing user preferences migration..."
   
   # Reset database
   npm run supabase:reset
   
   # Apply migrations
   npm run db:migrate
   
   # Test data insertion
   supabase db shell <<EOF
   INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
   INSERT INTO public.user_preferences (user_id, theme, font_size) 
   VALUES ((SELECT id FROM auth.users LIMIT 1), 'dark', 16);
   SELECT * FROM public.user_preferences;
   EOF
   
   echo "✅ Migration test passed"
   ```

6. **Document Migration**
   ```bash
   # Add to migration README
   echo "
   ## Migration: Add User Preferences Table
   
   **Date:** $(date +%Y-%m-%d)
   **Description:** Adds user_preferences table for storing user-specific settings
   
   **Changes:**
   - Creates user_preferences table
   - Adds RLS policies for user data isolation
   - Creates indexes for performance
   - Adds updated_at trigger
   
   **Dependencies:**
   - Requires auth.users table
   - Requires update_updated_at_column() function
   " >> supabase/migrations/README.md
   ```

### Commands to Run
```bash
# Complete migration workflow
supabase migration new descriptive_name
# Edit migration file
npm run db:migrate
npm run types:generate
./scripts/test-migrations.sh
npm run dev  # Test with app
```

### Common Pitfalls
- **Missing COMMIT statements** can leave transactions open
- **Forgetting RLS policies** creates security vulnerabilities
- **Not testing rollback** scenarios
- **Missing foreign key constraints** can cause data integrity issues

### Verification Steps
1. ✅ Migration applies without errors
2. ✅ Tables and columns created as expected
3. ✅ RLS policies work correctly
4. ✅ Indexes created for performance
5. ✅ Types generated successfully
6. ✅ Application works with new schema

---

## Testing with Seed Data

Workflow for populating test data for development and testing.

### Prerequisites
- Clean local database instance
- Understanding of data relationships
- Test scenarios identified

### Step-by-Step Instructions

1. **Create Seed Data Scripts**
   ```bash
   # Generate comprehensive seed data
   npm run seed:generate
   
   # Or create custom seed files
   touch supabase/seeds/06_test_scenarios.sql
   ```

2. **Write Seed SQL**
   ```sql
   -- supabase/seeds/06_test_scenarios.sql
   BEGIN;
   
   -- Insert test users
   INSERT INTO auth.users (id, email, email_confirmed_at, created_at) VALUES
     ('11111111-1111-1111-1111-111111111111', 'admin@test.com', NOW(), NOW()),
     ('22222222-2222-2222-2222-222222222222', 'user@test.com', NOW(), NOW());
   
   -- Insert user preferences
   INSERT INTO public.user_preferences (user_id, theme, font_size) VALUES
     ('11111111-1111-1111-1111-111111111111', 'dark', 16),
     ('22222222-2222-2222-2222-222222222222', 'light', 14);
   
   -- Insert test songs
   INSERT INTO public.songs (id, title, artist, key_signature, created_by) VALUES
     ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amazing Grace', 'Traditional', 'G', '11111111-1111-1111-1111-111111111111'),
     ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'How Great Thou Art', 'Traditional', 'A', '11111111-1111-1111-1111-111111111111');
   
   -- Insert arrangements
   INSERT INTO public.arrangements (song_id, name, content, created_by) VALUES
     ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Original Key', '{title: Amazing Grace}\n{key: G}\nAmazing [G]grace, how [D]sweet the [G]sound...', '11111111-1111-1111-1111-111111111111'),
     ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Capo 2', '{title: Amazing Grace}\n{key: G}\n{capo: 2}\nAmazing [G]grace, how [D]sweet the [G]sound...', '11111111-1111-1111-1111-111111111111');
   
   COMMIT;
   ```

3. **Reset and Seed Database**
   ```bash
   # Full reset with all seed data
   npm run supabase:reset
   
   # Or selective seeding
   supabase db seed -f supabase/seeds/06_test_scenarios.sql
   ```

4. **Create Edge Case Test Data**
   ```bash
   # Load edge case scenarios
   npm run seed:edge-cases
   
   # Load performance test data
   npm run seed:performance
   ```

5. **Verify Seed Data**
   ```bash
   supabase db shell
   ```
   ```sql
   -- Check record counts
   SELECT 'users' as table_name, COUNT(*) as count FROM auth.users
   UNION ALL
   SELECT 'songs', COUNT(*) FROM public.songs
   UNION ALL  
   SELECT 'arrangements', COUNT(*) FROM public.arrangements
   UNION ALL
   SELECT 'user_preferences', COUNT(*) FROM public.user_preferences;
   
   -- Check relationships
   SELECT s.title, COUNT(a.id) as arrangement_count
   FROM public.songs s
   LEFT JOIN public.arrangements a ON s.id = a.song_id
   GROUP BY s.id, s.title;
   ```

6. **Create Test Data Utilities**
   ```typescript
   // scripts/generate-test-data.ts
   import { faker } from '@faker-js/faker'
   
   interface TestSong {
     title: string
     artist: string
     key_signature: string
   }
   
   const generateSongs = (count: number): TestSong[] => {
     return Array.from({ length: count }, () => ({
       title: faker.music.songName(),
       artist: faker.person.fullName(),
       key_signature: faker.helpers.arrayElement(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
     }))
   }
   
   console.log(JSON.stringify(generateSongs(100), null, 2))
   ```

7. **Import Real Song Data**
   ```bash
   # Import from song database
   npm run seed:import song-database/*.txt
   
   # Custom import script
   tsx scripts/import-songs.ts --format chordpro --source song-database/
   ```

### Commands to Run
```bash
# Standard seeding workflow
npm run supabase:reset          # Clean slate
npm run seed:generate           # Generate test data
supabase status                 # Verify services
npm run dev                     # Test with application

# Custom seeding
npm run seed:custom -- supabase/seeds/my-test-data.sql
npm run seed:edge-cases         # Edge case scenarios
npm run seed:performance        # Performance testing data
```

### Common Pitfalls
- **Foreign key constraint errors** due to missing referenced records
- **Duplicate key violations** when re-running seeds
- **Inconsistent data relationships** that break application logic
- **Missing auth.users records** for RLS policies

### Verification Steps
1. ✅ All seed files execute without errors
2. ✅ Record counts match expectations
3. ✅ Foreign key relationships are valid
4. ✅ RLS policies work with test users
5. ✅ Application loads test data correctly
6. ✅ Search and filtering work with seed data

---

## Debugging Database Issues

Workflow for investigating and resolving database problems.

### Prerequisites
- Access to Supabase local instance
- Understanding of PostgreSQL basics
- Error logs and symptoms identified

### Step-by-Step Instructions

1. **Check Service Status**
   ```bash
   # Verify all services are running
   npm run supabase:status
   
   # Check specific service logs
   docker logs supabase_db_hsa-songbook-local
   docker logs supabase_api_hsa-songbook-local
   ```

2. **Connect to Database Shell**
   ```bash
   # Open PostgreSQL shell
   supabase db shell
   
   # Or with specific database
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```

3. **Analyze Query Performance**
   ```sql
   -- Enable query timing
   \timing on
   
   -- Analyze slow queries
   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM songs WHERE title ILIKE '%love%';
   
   -- Check for missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation 
   FROM pg_stats 
   WHERE schemaname = 'public' AND tablename = 'songs';
   
   -- Find slowest queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

4. **Check RLS Policy Issues**
   ```sql
   -- Test policies as different users
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
   
   SELECT * FROM songs;  -- Should only show user's songs
   
   -- Reset role
   RESET ROLE;
   
   -- Check policy definitions
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

5. **Investigate Connection Issues**
   ```bash
   # Check connection limits
   supabase db shell
   ```
   ```sql
   SHOW max_connections;
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check active connections
   SELECT pid, usename, application_name, client_addr, state, query
   FROM pg_stat_activity
   WHERE state = 'active';
   ```

6. **Monitor Real-time Subscriptions**
   ```sql
   -- Check realtime publication
   SELECT * FROM pg_publication;
   SELECT * FROM pg_publication_tables;
   
   -- Test realtime triggers
   SELECT * FROM supabase_realtime.messages ORDER BY inserted_at DESC LIMIT 10;
   ```

7. **Fix Data Integrity Issues**
   ```sql
   -- Find orphaned records
   SELECT a.id, a.song_id 
   FROM arrangements a 
   LEFT JOIN songs s ON a.song_id = s.id 
   WHERE s.id IS NULL;
   
   -- Check foreign key constraints
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint 
   WHERE contype = 'f' AND connamespace = 'public'::regnamespace;
   
   -- Validate data types
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'songs';
   ```

8. **Reset and Rebuild**
   ```bash
   # Nuclear option - complete reset
   npm run supabase:stop
   docker system prune -f
   npm run supabase:start
   npm run db:migrate
   npm run seed:generate
   ```

### Commands to Run
```bash
# Database debugging workflow
npm run supabase:status         # Check service health
supabase db shell              # Connect to database
# Run SQL diagnostics
npm run types:generate         # Refresh types
npm run dev                    # Test application
```

### Common Issues and Solutions

**Connection Refused:**
```bash
# Check if database is running
docker ps | grep supabase_db
# Restart if needed
npm run supabase:stop && npm run supabase:start
```

**Migration Errors:**
```bash
# Check migration status
supabase migration list --local
# Fix and reapply
npm run supabase:reset
```

**RLS Policy Problems:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable after debugging!
```

### Verification Steps
1. ✅ All services are running correctly
2. ✅ Database connections work
3. ✅ Queries execute in reasonable time
4. ✅ RLS policies behave as expected  
5. ✅ Data integrity constraints are satisfied
6. ✅ Application functionality restored

---

## Implementing Authentication

Workflow for adding or modifying authentication in the application.

### Prerequisites
- Understanding of Supabase Auth concepts
- Knowledge of React Context/hooks
- Security requirements defined

### Step-by-Step Instructions

1. **Configure Supabase Auth**
   ```toml
   # supabase/config.toml
   [auth]
   enable_signup = true
   site_url = "http://localhost:5173"
   additional_redirect_urls = ["http://localhost:3000"]
   
   [auth.email]
   enable_signup = true
   enable_confirmations = false  # For development
   ```

2. **Create Auth Context**
   ```typescript
   // src/features/auth/contexts/AuthContext.tsx
   import { createContext, useContext, useEffect, useState } from 'react'
   import { Session, User } from '@supabase/supabase-js'
   import { supabase } from '@lib/supabase'
   
   interface AuthContextType {
     session: Session | null
     user: User | null
     loading: boolean
     signOut: () => Promise<void>
   }
   
   const AuthContext = createContext<AuthContextType | undefined>(undefined)
   
   export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [session, setSession] = useState<Session | null>(null)
     const [loading, setLoading] = useState(true)
   
     useEffect(() => {
       // Get initial session
       supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session)
         setLoading(false)
       })
   
       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         async (event, session) => {
           setSession(session)
           setLoading(false)
         }
       )
   
       return () => subscription.unsubscribe()
     }, [])
   
     const signOut = async () => {
       await supabase.auth.signOut()
     }
   
     return (
       <AuthContext.Provider value={{
         session,
         user: session?.user ?? null,
         loading,
         signOut
       }}>
         {children}
       </AuthContext.Provider>
     )
   }
   
   export const useAuth = () => {
     const context = useContext(AuthContext)
     if (context === undefined) {
       throw new Error('useAuth must be used within an AuthProvider')
     }
     return context
   }
   ```

3. **Create Auth Components**
   ```typescript
   // src/features/auth/components/LoginForm.tsx
   import { useState } from 'react'
   import { supabase } from '@lib/supabase'
   
   export const LoginForm = () => {
     const [email, setEmail] = useState('')
     const [password, setPassword] = useState('')
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)
   
     const handleLogin = async (e: React.FormEvent) => {
       e.preventDefault()
       setLoading(true)
       setError(null)
   
       const { error } = await supabase.auth.signInWithPassword({
         email,
         password
       })
   
       if (error) {
         setError(error.message)
       }
       setLoading(false)
     }
   
     return (
       <form onSubmit={handleLogin}>
         <input
           type="email"
           placeholder="Email"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           required
         />
         <input
           type="password"
           placeholder="Password"
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           required
         />
         <button type="submit" disabled={loading}>
           {loading ? 'Signing in...' : 'Sign In'}
         </button>
         {error && <div className="error">{error}</div>}
       </form>
     )
   }
   ```

4. **Create Protected Route Component**
   ```typescript
   // src/features/auth/components/ProtectedRoute.tsx
   import { useAuth } from '../contexts/AuthContext'
   import { LoginForm } from './LoginForm'
   
   interface ProtectedRouteProps {
     children: React.ReactNode
     fallback?: React.ReactNode
   }
   
   export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
     children,
     fallback = <LoginForm />
   }) => {
     const { user, loading } = useAuth()
   
     if (loading) {
       return <div>Loading...</div>
     }
   
     if (!user) {
       return <>{fallback}</>
     }
   
     return <>{children}</>
   }
   ```

5. **Set Up Row Level Security**
   ```sql
   -- Add RLS policies for user-specific data
   CREATE POLICY "Users can only see own data" 
     ON public.songs FOR SELECT
     TO authenticated
     USING (auth.uid() = created_by);
   
   CREATE POLICY "Users can insert own data"
     ON public.songs FOR INSERT
     TO authenticated  
     WITH CHECK (auth.uid() = created_by);
   
   CREATE POLICY "Users can update own data"
     ON public.songs FOR UPDATE
     TO authenticated
     USING (auth.uid() = created_by);
   ```

6. **Add Role-Based Access Control (RBAC)**
   ```sql
   -- Create roles table
   CREATE TABLE public.user_roles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(user_id)
   );
   
   -- Create helper function
   CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
   RETURNS TEXT AS $$
     SELECT role FROM public.user_roles WHERE user_id = $1;
   $$ LANGUAGE sql SECURITY DEFINER;
   
   -- Use in RLS policies
   CREATE POLICY "Admins can see all songs"
     ON public.songs FOR SELECT
     TO authenticated
     USING (public.get_user_role(auth.uid()) = 'admin');
   ```

7. **Create Auth Hooks**
   ```typescript
   // src/features/auth/hooks/useRoles.ts
   import { useQuery } from '@tanstack/react-query'
   import { supabase } from '@lib/supabase'
   import { useAuth } from '../contexts/AuthContext'
   
   export const useUserRole = () => {
     const { user } = useAuth()
     
     return useQuery({
       queryKey: ['user-role', user?.id],
       queryFn: async () => {
         if (!user) return null
         
         const { data, error } = await supabase
           .from('user_roles')
           .select('role')
           .eq('user_id', user.id)
           .single()
         
         if (error) throw error
         return data.role
       },
       enabled: !!user
     })
   }
   
   export const usePermissions = () => {
     const { data: role } = useUserRole()
     
     return {
       canModerate: role === 'admin' || role === 'moderator',
       canAdmin: role === 'admin',
       isUser: role === 'user'
     }
   }
   ```

8. **Add Authentication to App Root**
   ```typescript
   // src/app/App.tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   import { AuthProvider } from '@features/auth/contexts/AuthContext'
   import { ProtectedRoute } from '@features/auth/components/ProtectedRoute'
   
   const queryClient = new QueryClient()
   
   export const App = () => {
     return (
       <QueryClientProvider client={queryClient}>
         <AuthProvider>
           <ProtectedRoute>
             <Routes>
               {/* Your app routes */}
             </Routes>
           </ProtectedRoute>
         </AuthProvider>
       </QueryClientProvider>
     )
   }
   ```

### Commands to Run
```bash
# Auth implementation workflow
supabase migration new add_user_roles_table
npm run db:migrate
npm run types:generate
npm run dev
npm run test src/features/auth
```

### Common Pitfalls
- **Not handling loading states** properly
- **Missing RLS policies** for user isolation
- **Forgetting to wrap app in AuthProvider**
- **Not securing API endpoints** on the backend

### Verification Steps
1. ✅ Users can sign up and sign in
2. ✅ Auth state persists across page refreshes  
3. ✅ Protected routes work correctly
4. ✅ RLS policies enforce data isolation
5. ✅ Role-based permissions work
6. ✅ Sign out clears session properly

---

## Performance Optimization

Workflow for identifying and fixing performance bottlenecks.

### Prerequisites
- Application running in development mode
- Browser developer tools available
- Understanding of React performance concepts

### Step-by-Step Instructions

1. **Profile Application Performance**
   ```bash
   # Enable performance monitoring
   npm run dev
   # Open http://localhost:5173
   # F12 → Performance tab → Record → Use app → Stop
   ```

2. **Analyze Bundle Size**
   ```bash
   # Generate bundle analysis
   npm run build
   npm run analyze
   
   # Check for large dependencies
   npx bundle-phobia <package-name>
   
   # Identify unused code
   npx depcheck
   ```

3. **Optimize Database Queries**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries >100ms
   
   -- Find slow queries
   SELECT query, mean_time, calls, total_time
   FROM pg_stat_statements 
   WHERE mean_time > 100
   ORDER BY mean_time DESC;
   
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_songs_title_gin 
   ON songs USING gin(to_tsvector('english', title));
   ```

4. **Implement React Optimizations**
   ```typescript
   // Use React.memo for expensive components
   export const SongList = React.memo<SongListProps>(({ songs, onSelect }) => {
     return (
       <ul>
         {songs.map(song => (
           <SongItem key={song.id} song={song} onSelect={onSelect} />
         ))}
       </ul>
     )
   })
   
   // Use useMemo for expensive calculations
   const expensiveValue = useMemo(() => {
     return songs.filter(song => song.isActive).sort((a, b) => a.title.localeCompare(b.title))
   }, [songs])
   
   // Use useCallback for event handlers
   const handleSongSelect = useCallback((songId: string) => {
     onSongSelect(songId)
   }, [onSongSelect])
   ```

5. **Optimize React Query Usage**
   ```typescript
   // Implement proper caching strategies
   export const useSongs = (filters?: SongFilters) => {
     return useQuery({
       queryKey: ['songs', filters],
       queryFn: () => songService.getAll(filters),
       staleTime: 5 * 60 * 1000, // 5 minutes
       cacheTime: 10 * 60 * 1000, // 10 minutes
       refetchOnWindowFocus: false
     })
   }
   
   // Use optimistic updates
   export const useUpdateSong = () => {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: songService.update,
       onMutate: async (updatedSong) => {
         // Cancel outgoing refetches
         await queryClient.cancelQueries({ queryKey: ['songs'] })
         
         // Snapshot previous value
         const previousSongs = queryClient.getQueryData(['songs'])
         
         // Optimistically update
         queryClient.setQueryData(['songs'], (old: Song[]) =>
           old.map(song => song.id === updatedSong.id ? updatedSong : song)
         )
         
         return { previousSongs }
       },
       onError: (err, updatedSong, context) => {
         // Rollback on error
         queryClient.setQueryData(['songs'], context.previousSongs)
       }
     })
   }
   ```

6. **Implement Code Splitting**
   ```typescript
   // Lazy load heavy components
   const ChordEditor = lazy(() => import('@features/arrangements/components/ChordEditor'))
   const AdminDashboard = lazy(() => import('@app/pages/AdminDashboard'))
   
   // Use Suspense
   <Suspense fallback={<div>Loading editor...</div>}>
     <ChordEditor />
   </Suspense>
   
   // Route-based splitting
   const routes = [
     {
       path: '/admin',
       element: (
         <Suspense fallback={<div>Loading admin...</div>}>
           <AdminDashboard />
         </Suspense>
       )
     }
   ]
   ```

7. **Optimize Images and Assets**
   ```bash
   # Optimize images in public folder
   npx imagemin public/*.{jpg,png} --out-dir=public/optimized
   
   # Use WebP format where possible
   # Add to vite.config.ts
   import { defineConfig } from 'vite'
   
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           assetFileNames: (assetInfo) => {
             const info = assetInfo.name.split('.')
             const extType = info[info.length - 1]
             if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
               return `images/[name]-[hash][extname]`
             }
             return `assets/[name]-[hash][extname]`
           }
         }
       }
     }
   })
   ```

8. **Implement Virtual Scrolling**
   ```typescript
   // For large lists, implement virtual scrolling
   import { VirtualChordScroller } from '@features/arrangements/components/VirtualChordScroller'
   
   const SongList = ({ songs }: { songs: Song[] }) => {
     if (songs.length > 100) {
       return (
         <VirtualChordScroller
           items={songs}
           itemHeight={60}
           renderItem={({ item }) => <SongItem song={item} />}
         />
       )
     }
     
     return (
       <ul>
         {songs.map(song => <SongItem key={song.id} song={song} />)}
       </ul>
     )
   }
   ```

9. **Monitor Performance Metrics**
   ```typescript
   // Add Web Vitals monitoring
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
   
   const reportWebVitals = (metric: any) => {
     console.log(metric)
     // Send to analytics service
   }
   
   getCLS(reportWebVitals)
   getFID(reportWebVitals)
   getFCP(reportWebVitals)
   getLCP(reportWebVitals)
   getTTFB(reportWebVitals)
   ```

### Commands to Run
```bash
# Performance optimization workflow
npm run build                   # Create production build
npm run analyze                 # Analyze bundle size
npm run test:coverage          # Check test coverage
npm run dev                    # Test in development
# Use browser dev tools for profiling
```

### Performance Targets
- **First Contentful Paint (FCP):** < 2 seconds
- **Largest Contentful Paint (LCP):** < 3 seconds  
- **Time to Interactive (TTI):** < 4 seconds
- **Bundle size:** < 1MB gzipped
- **Database queries:** < 200ms average

### Verification Steps
1. ✅ Bundle size reduced significantly
2. ✅ Database queries optimized
3. ✅ React components memoized appropriately
4. ✅ Code splitting implemented
5. ✅ Performance metrics improved
6. ✅ User experience feels snappy

---

## Deployment Preparation

Workflow for preparing the application for production deployment.

### Prerequisites
- Development environment working correctly
- Production Supabase project created
- Deployment target decided (Vercel, Netlify, etc.)

### Step-by-Step Instructions

1. **Environment Configuration**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Update with production values
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
   NODE_ENV=production
   VITE_TURNSTILE_SITE_KEY=your-production-turnstile-key
   ```

2. **Database Migration to Production**
   ```bash
   # Link to production project
   supabase link --project-ref your-project-ref
   
   # Push migrations to production
   supabase db push
   
   # Generate production types
   supabase gen types typescript --project-id your-project-ref > src/lib/database.types.ts
   ```

3. **Security Configuration**
   ```bash
   # Enable RLS on all tables
   supabase db shell --project-ref your-project-ref
   ```
   ```sql
   -- Verify RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Enable where missing
   ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;
   ```

4. **Production Build Testing**
   ```bash
   # Create production build
   NODE_ENV=production npm run build
   
   # Test production build locally
   npm run preview
   
   # Run production tests
   NODE_ENV=production npm run test:ci
   
   # Check bundle size
   npm run analyze
   ```

5. **Configure Auth for Production**
   ```sql
   -- In Supabase Dashboard → Authentication → URL Configuration
   Site URL: https://your-domain.com
   Additional redirect URLs: https://your-domain.com/auth/callback
   
   -- Rate limiting configuration
   Update supabase/config.toml and apply to production
   ```

6. **Set Up Error Monitoring**
   ```typescript
   // Add error reporting service
   import * as Sentry from '@sentry/react'
   
   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: 'production'
     })
   }
   ```

7. **Configure PWA for Production**
   ```typescript
   // Update vite.config.ts
   export default defineConfig({
     plugins: [
       VitePWA({
         registerType: 'autoUpdate',
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
           runtimeCaching: [
             // Production-optimized caching strategies
           ]
         }
       })
     ]
   })
   ```

8. **Deploy to Hosting Platform**
   
   **Vercel:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   
   # Configure environment variables in Vercel dashboard
   ```
   
   **Netlify:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Build and deploy
   npm run build
   netlify deploy --prod --dir=dist
   ```

9. **Post-Deployment Verification**
   ```bash
   # Health check endpoints
   curl https://your-domain.com/health
   curl https://your-domain.com/api/status
   
   # Test key functionality
   # - User registration/login
   # - Song creation/editing
   # - Search functionality
   # - PWA installation
   ```

10. **Set Up Monitoring**
    ```javascript
    // Add to production build
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
    }
    
    // Monitor performance
    import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
    
    const sendToAnalytics = (metric) => {
      // Send to your analytics service
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(metric)
      })
    }
    
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
    ```

### Commands to Run
```bash
# Complete deployment workflow
npm run lint                    # Code quality check
npm run test:ci                # Full test suite  
npm run build                  # Production build
npm run preview                # Test production build
supabase db push              # Deploy database changes
vercel --prod                 # Deploy to hosting
```

### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] No ESLint errors
- [ ] Bundle size is acceptable
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Auth configuration updated
- [ ] Error monitoring configured
- [ ] Performance monitoring setup
- [ ] Domain and SSL configured

### Verification Steps
1. ✅ Application loads successfully
2. ✅ All features work in production
3. ✅ Authentication flows properly
4. ✅ Database operations succeed
5. ✅ PWA installs correctly
6. ✅ Performance meets targets
7. ✅ Error reporting works
8. ✅ Monitoring dashboards active

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **React Query Documentation:** https://tanstack.com/query/latest
- **Vite Documentation:** https://vitejs.dev/guide/
- **PostgreSQL Performance:** https://wiki.postgresql.org/wiki/Performance_Optimization
- **Web Performance:** https://web.dev/performance/

For workflow-specific questions, check the project's GitHub issues or create a new issue with the `workflow` label.

---

## See Also

- 🚀 **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 5 minutes
- 📖 **[README.md](../README.md)** - Project overview and features
- 🎓 **[ONBOARDING.md](./ONBOARDING.md)** - Comprehensive developer guide
- 🔧 **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions to common problems
- ⚡ **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Command cheat sheet
- 📊 **[Diagrams](./diagrams/)** - Visual architecture and workflow diagrams