# ⚡ Quick Reference Guide

This is your go-to reference for commands, shortcuts, patterns, and configurations in the HSA Songbook project.

## Command Cheat Sheet

### Development Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `npm run dev` | Start development server with HMR | Daily development work |
| `npm run build` | Create production build | Before deployment, CI/CD |
| `npm run preview` | Preview production build locally | Test production build |
| `npm run lint` | Run ESLint code quality checks | Before commits, CI/CD |
| `npm run test` | Run test suite | During development |
| `npm run test:ui` | Open Vitest UI for interactive testing | Test debugging |
| `npm run test:coverage` | Generate test coverage report | Code quality review |
| `npm run test:watch` | Run tests in watch mode | TDD workflow |
| `npm run test:ci` | Run tests for CI with coverage | Automated testing |

### Database Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `npm run supabase:start` | Start local Supabase stack | Begin development session |
| `npm run supabase:stop` | Stop local Supabase services | End development session |
| `npm run supabase:status` | Check service status and URLs | Debugging connection issues |
| `npm run supabase:reset` | Reset database to clean state | Fix corrupted dev data |
| `npm run dev:local` | Start Supabase + dev server together | One-command development start |
| `npm run db:migrate` | Apply pending migrations | After creating migrations |
| `npm run db:reset` | Reset database with migrations | Clean slate with schema |
| `npm run db:diff` | Generate migration from schema changes | Manual schema modifications |
| `npm run db:push` | Push local migrations to remote | Deploy database changes |

### Migration Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `./scripts/migrate-up.sh` | Apply next migration | Step-by-step migration testing |
| `./scripts/migrate-down.sh` | Rollback last migration | Fix failed migrations |
| `./scripts/test-migrations.sh` | Test migration rollback/forward | Before deploying migrations |
| `supabase migration new <name>` | Create new migration file | Adding database schema changes |
| `supabase migration list --local` | List migration status | Check what's applied |

### Type Generation Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `npm run types:generate` | Generate TypeScript types from DB | After schema changes |
| `./scripts/generate-types.sh` | Alternative type generation script | If npm script fails |
| `supabase gen types typescript --local` | Direct CLI type generation | Manual type generation |

### Seed Data Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `npm run seed:generate` | Generate comprehensive seed data | Set up realistic test data |
| `npm run seed:import` | Import songs from files | Add real song content |
| `npm run seed:reset` | Reset DB and apply all seeds | Clean development environment |
| `npm run seed:custom -- <file>` | Load specific seed file | Test specific scenarios |
| `npm run seed:edge-cases` | Load edge case test data | Test error handling |
| `npm run seed:performance` | Load large dataset for testing | Performance testing |

### Build & Analysis Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `npm run analyze` | Generate bundle analysis report | Optimize bundle size |
| `npm run analyze:ci` | Generate JSON bundle analysis | CI/CD bundle monitoring |
| `npx depcheck` | Find unused dependencies | Clean up package.json |
| `npx bundle-phobia <package>` | Check package size impact | Before adding dependencies |

### Utility Commands

| Command | Description | When to Use |
|---------|------------|-------------|
| `./scripts/setup-local.sh` | Complete local environment setup | New developer onboarding |
| `./scripts/verify-local.sh` | Verify local setup is working | Troubleshoot setup issues |
| `tsx scripts/generate-seed-data.ts` | Generate custom seed data | Create specific test scenarios |
| `supabase db shell` | Open PostgreSQL shell | Database debugging |

---

## Keyboard Shortcuts

### VS Code Project-Specific

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+P` → "TypeScript: Restart TS Server" | Restart TypeScript | After type generation |
| `Ctrl+Shift+P` → "Developer: Reload Window" | Reload VS Code | After config changes |
| `Ctrl+`` ` `` | Toggle integrated terminal | Quick terminal access |
| `Ctrl+Shift+`` ` `` | Create new terminal | Multiple terminal sessions |
| `F5` | Start debugging | Debug React app |
| `Ctrl+F5` | Run without debugging | Start app quickly |

### Browser Development

| Shortcut | Action | Context |
|----------|--------|---------|
| `F12` | Open Developer Tools | Debug React components |
| `Ctrl+Shift+I` | Open Developer Tools (Alt) | Debug React components |
| `Ctrl+Shift+C` | Element inspector | Inspect UI components |
| `Ctrl+Shift+J` | Console tab | View console logs |
| `Ctrl+Shift+R` | Hard refresh | Clear cache and reload |
| `Ctrl+R` | Refresh page | Standard page reload |
| `F5` | Refresh page (Alt) | Standard page reload |

### Supabase Studio

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Enter` | Execute SQL query | SQL Editor |
| `Ctrl+Shift+Enter` | Execute selected SQL | SQL Editor |
| `Escape` | Close modal/dialog | Navigation |

---

## Common Patterns

### React Query Patterns

```typescript
// Standard data fetching
export const useSongs = (filters?: SongFilters) => {
  return useQuery({
    queryKey: ['songs', filters],
    queryFn: () => songService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Optimistic updates
export const useUpdateSong = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: songService.update,
    onMutate: async (updatedSong) => {
      await queryClient.cancelQueries({ queryKey: ['songs'] })
      const previousSongs = queryClient.getQueryData(['songs'])
      queryClient.setQueryData(['songs'], (old: Song[]) =>
        old.map(song => song.id === updatedSong.id ? updatedSong : song)
      )
      return { previousSongs }
    },
    onError: (err, updatedSong, context) => {
      queryClient.setQueryData(['songs'], context.previousSongs)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    }
  })
}

// Infinite queries for pagination
export const useInfiniteSongs = (filters?: SongFilters) => {
  return useInfiniteQuery({
    queryKey: ['songs', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      songService.getPage(pageParam, 20, filters),
    getNextPageParam: (lastPage) => 
      lastPage.length === 20 ? lastPage[lastPage.length - 1].id : undefined
  })
}
```

### Supabase Client Patterns

```typescript
// Basic CRUD operations
const songService = {
  async getAll(filters?: SongFilters) {
    let query = supabase.from('songs').select('*')
    
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters?.key_signature) {
      query = query.eq('key_signature', filters.key_signature)
    }
    
    const { data, error } = await query.order('title')
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('songs')
      .select('*, arrangements(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(song: NewSong) {
    const { data, error } = await supabase
      .from('songs')
      .insert(song)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdateSong) {
    const { data, error } = await supabase
      .from('songs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// Real-time subscriptions
const useRealtimeSongs = () => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const subscription = supabase
      .channel('songs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'songs'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['songs'] })
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [queryClient])
}

// File upload pattern
const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
  
  return publicUrl.publicUrl
}
```

### TypeScript Patterns

```typescript
// Database type utilities
type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Generic service type
interface CrudService<T, TInsert = Omit<T, 'id' | 'created_at' | 'updated_at'>, TUpdate = Partial<TInsert>> {
  getAll(filters?: Record<string, any>): Promise<T[]>
  getById(id: string): Promise<T>
  create(data: TInsert): Promise<T>
  update(id: string, data: TUpdate): Promise<T>
  delete(id: string): Promise<void>
}

// Form validation patterns
const createFormSchema = <T extends Record<string, any>>(shape: {
  [K in keyof T]: z.ZodType<T[K]>
}) => z.object(shape)

// Example usage
const songFormSchema = createFormSchema({
  title: z.string().min(1, 'Title is required').max(200),
  artist: z.string().min(1, 'Artist is required').max(200),
  key_signature: z.enum(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']),
  bpm: z.number().min(60).max(200).optional(),
  is_public: z.boolean().default(true)
})

type SongFormData = z.infer<typeof songFormSchema>
```

### Component Patterns

```typescript
// Component with loading and error states
interface DataComponentProps<T> {
  data?: T[]
  isLoading: boolean
  error?: Error | null
  fallback?: React.ReactNode
  children: (data: T[]) => React.ReactNode
}

function DataComponent<T>({ 
  data, 
  isLoading, 
  error, 
  fallback, 
  children 
}: DataComponentProps<T>) {
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data || data.length === 0) return fallback || <div>No data</div>
  return <>{children(data)}</>
}

// Usage
const SongList = () => {
  const { data: songs, isLoading, error } = useSongs()
  
  return (
    <DataComponent
      data={songs}
      isLoading={isLoading}
      error={error}
      fallback={<div>No songs found</div>}
    >
      {(songs) => (
        <ul>
          {songs.map(song => (
            <li key={song.id}>{song.title}</li>
          ))}
        </ul>
      )}
    </DataComponent>
  )
}

// Compound component pattern
const Modal = ({ children, isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

Modal.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-header">{children}</div>
)

Modal.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-body">{children}</div>
)

Modal.Footer = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-footer">{children}</div>
)

// Usage
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>
    <h2>Edit Song</h2>
  </Modal.Header>
  <Modal.Body>
    <SongForm song={selectedSong} />
  </Modal.Body>
  <Modal.Footer>
    <button onClick={handleSave}>Save</button>
    <button onClick={handleClose}>Cancel</button>
  </Modal.Footer>
</Modal>
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example | Environment |
|----------|-------------|---------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | All |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | All |
| `NODE_ENV` | Environment mode | `development`, `production` | All |

### Optional Variables

| Variable | Description | Example | Environment |
|----------|-------------|---------|-------------|
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | `1x00000000000000000000AA` | Production |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `https://abc123@sentry.io/123456` | Production |
| `VITE_ANALYTICS_ID` | Google Analytics tracking ID | `G-XXXXXXXXXX` | Production |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` | Development |

### Environment-Specific Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env.local` | Local development overrides | Daily development |
| `.env.staging` | Staging environment config | Staging deployments |
| `.env.production` | Production environment config | Production deployments |
| `.env.example` | Template and documentation | New developer setup |

### Environment Setup Commands

```bash
# Copy example to local environment
cp .env.example .env.local

# Generate local Supabase credentials
npm run supabase:start
# Copy anon key from output to .env.local

# Verify environment variables
node -e "console.log(process.env)" | grep VITE_
```

---

## Port Reference

### Supabase Services (Local)

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API Server** | 54321 | http://localhost:54321 | REST API, GraphQL |
| **Database** | 54322 | postgresql://localhost:54322/postgres | PostgreSQL connection |
| **Studio** | 54323 | http://localhost:54323 | Database admin interface |
| **Inbucket** | 54324 | http://localhost:54324 | Email testing server |
| **Storage** | 54325 | http://localhost:54325 | File storage API |
| **Edge Runtime** | 54326 | http://localhost:54326 | Edge functions |
| **Analytics** | 54327 | http://localhost:54327 | Analytics service |
| **Shadow DB** | 54320 | - | Migration shadow database |
| **Pooler** | 54329 | - | Connection pooler |

### Development Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Vite Dev Server** | 5173 | http://localhost:5173 | Main application |
| **Vite HMR** | 5173 | ws://localhost:5173 | Hot module replacement |
| **Vitest UI** | 51204 | http://localhost:51204 | Test runner interface |
| **Express API** | 5000 | http://localhost:5000 | Backend API (if used) |

### Debugging Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Edge Inspector** | 8083 | http://localhost:8083 | Edge function debugging |
| **React DevTools** | - | Browser extension | React component debugging |

### Port Conflict Resolution

```bash
# Check what's using a port
lsof -i :54321  # macOS/Linux
netstat -ano | findstr :54321  # Windows

# Kill process using port
sudo kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Change Supabase ports in config.toml
[api]
port = 54331  # Instead of 54321

[db]  
port = 54332  # Instead of 54322

[studio]
port = 54333  # Instead of 54323
```

---

## Common File Paths

### Configuration Files

```
/var/home/kenmen/code/src/github/Kuebic/hsa-songbook/
├── package.json                    # Dependencies and scripts
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Test configuration
├── eslint.config.js               # Code linting rules
├── tailwind.config.js             # CSS framework config
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.node.json             # Node.js TS config
└── supabase/
    ├── config.toml                # Supabase local config
    ├── migrations/                # Database migrations
    └── seeds/                     # Seed data files
```

### Source Code Structure

```
src/
├── app/                           # Application core
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Application entry
│   └── pages/                    # Top-level pages
├── features/                      # Feature modules
│   ├── auth/                     # Authentication
│   ├── songs/                    # Song management
│   ├── arrangements/             # Chord editing
│   ├── setlists/                 # Setlist features
│   └── [feature]/
│       ├── components/           # Feature components
│       ├── hooks/                # Feature-specific hooks
│       ├── services/             # API services
│       ├── types/                # TypeScript types
│       └── validation/           # Zod schemas
├── shared/                       # Shared resources
│   ├── components/               # Reusable components
│   ├── contexts/                 # Global contexts
│   ├── styles/                   # Global styles
│   └── utils/                    # Utility functions
└── lib/                          # Core utilities
    ├── supabase.ts               # Supabase client
    ├── database.types.ts         # Generated DB types
    └── utils.ts                  # Helper functions
```

### Important Scripts

```
scripts/
├── setup-local.sh                # Environment setup
├── verify-local.sh               # Setup verification
├── migrate-up.sh                 # Apply one migration
├── migrate-down.sh               # Rollback one migration
├── test-migrations.sh            # Test migration rollback
├── generate-types.sh             # Generate TypeScript types
├── generate-seed-data.ts         # Generate test data
└── import-songs.ts               # Import song files
```

---

## Debugging Quick Commands

### Database Debugging

```bash
# Connect to database
supabase db shell

# Check migration status
supabase migration list --local

# View recent logs
docker logs supabase_db_hsa-songbook-local --tail 50

# Reset everything
npm run supabase:reset && npm run dev
```

### Application Debugging

```bash
# Clear all caches
rm -rf node_modules/.vite node_modules/.cache
npm install

# Restart TypeScript server (VS Code)
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Check bundle size
npm run build && npm run analyze

# Run with verbose logging
DEBUG=* npm run dev
```

### Performance Debugging

```sql
-- In supabase db shell
-- Enable query timing
\timing on

-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Emergency Commands

### Fix Broken Development Environment

```bash
# Nuclear reset - start fresh
npm run supabase:stop
docker system prune -af
rm -rf node_modules package-lock.json
npm install
./scripts/setup-local.sh
npm run dev
```

### Fix Broken Database

```bash
# Reset database completely
npm run supabase:stop
npm run supabase:start
npm run db:migrate
npm run seed:generate
```

### Fix Type Issues

```bash
# Regenerate all types
npm run types:generate
# Restart TS server in VS Code
# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Fix Build Issues

```bash
# Clean build cache
rm -rf dist node_modules/.vite
npm run build

# Check for dependency issues
npm audit fix
npx depcheck
```

---

## Useful One-Liners

```bash
# Quick dev environment start
npm run supabase:start && npm run dev

# Check if all services are healthy
curl -f http://localhost:54321/health && curl -f http://localhost:5173

# Generate migration and apply immediately
supabase migration new "$(read -p 'Migration name: ' name && echo $name)" && npm run db:migrate

# Reset DB and populate with fresh data
npm run supabase:reset && sleep 5 && npm run seed:generate

# Find large files in repository
find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*"

# Count lines of code (excluding dependencies)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Check for TODO/FIXME comments
grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx"

# Backup current database
pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backup.sql

# Restore database from backup
psql postgresql://postgres:postgres@localhost:54322/postgres < backup.sql
```

---

This quick reference is designed to be your first stop for common HSA Songbook development tasks. Keep it bookmarked and refer to it whenever you need a quick command or pattern reminder!

---

## See Also

- 🚀 **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 5 minutes
- 📖 **[README.md](../README.md)** - Project overview and features
- 🎓 **[ONBOARDING.md](./ONBOARDING.md)** - Comprehensive developer guide
- 🔧 **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions to common problems
- 💡 **[WORKFLOWS.md](./WORKFLOWS.md)** - Step-by-step development workflows
- 📊 **[Diagrams](./diagrams/)** - Visual architecture and workflow diagrams