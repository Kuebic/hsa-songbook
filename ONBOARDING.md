# HSA Songbook - Developer Onboarding Guide

Welcome to the HSA Songbook project! This comprehensive guide will help you understand the codebase, set up your development environment, and start contributing effectively.

## 1. Project Overview

### What is HSA Songbook?
HSA Songbook is a modern, responsive web application for managing worship songs with ChordPro formatting. It's built for the Unificationist musician community to easily organize chord charts, create setlists, and perform worship services.

### Core Functionality
- **Song Library Management**: Browse, search, and manage a comprehensive collection of worship songs
- **ChordPro Editor**: Full-featured editor with live preview, syntax highlighting, and auto-save
- **Smart Search**: Lightning-fast full-text search across titles, artists, and lyrics
- **Setlist Management**: Create, organize, and share setlists with drag-and-drop support
- **Progressive Web App**: Works offline with smart caching and installable on devices
- **Role-Based Access**: Public, User, Moderator, and Admin permission levels

### Tech Stack

#### Frontend
- **Framework**: React 19.1 with TypeScript 5.8
- **Build Tool**: Vite 7.0 (fast HMR, optimized builds)
- **Styling**: Tailwind CSS 4.1 + CSS Modules
- **UI Components**: Custom components with ShadCN patterns
- **State Management**: 
  - TanStack Query v5 for server state
  - React Context for client state
  - IndexedDB for persistent storage
- **Routing**: React Router v7 with lazy loading
- **Editor**: CodeMirror v6 for ChordPro editing
- **ChordPro Parsing**: ChordSheetJS v12

#### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Storage**: IndexedDB with LZ-String compression
- **PWA**: Vite PWA plugin with Workbox (currently disabled)

#### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9 with React plugins
- **Testing**: Vitest with React Testing Library
- **Type Checking**: TypeScript strict mode
- **Bundle Analysis**: rollup-plugin-visualizer

### Architecture Pattern
The project follows a **Feature-First Architecture** with clear separation of concerns:
- Feature modules encapsulate related functionality
- Shared components and utilities promote reusability
- Three-tier storage system for reliability
- Optimistic updates for better UX

## 2. Repository Structure

```
hsa-songbook/
├── src/                        # Source code
│   ├── app/                    # Application core
│   │   ├── App.tsx            # Main app component with routing
│   │   ├── main.tsx           # Entry point, React Query setup
│   │   └── pages/             # Route pages (Home, Search, Admin)
│   │
│   ├── features/              # Feature-based modules
│   │   ├── arrangements/      # ChordPro editor & viewer
│   │   │   ├── components/    # UI components
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── services/      # Business logic
│   │   │   └── pages/         # Feature pages
│   │   ├── auth/              # Authentication system
│   │   ├── songs/             # Song CRUD operations
│   │   ├── setlists/          # Setlist management
│   │   ├── search/            # Search functionality
│   │   ├── admin/             # Admin dashboard
│   │   ├── moderation/        # Content moderation
│   │   ├── permissions/       # RBAC system
│   │   ├── multilingual/      # Multi-language support
│   │   ├── monitoring/        # Error boundaries, web vitals
│   │   ├── pwa/              # Progressive web app (disabled)
│   │   └── responsive/        # Mobile navigation
│   │
│   ├── shared/                # Shared resources
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # Global React contexts
│   │   ├── styles/            # Global styles, CSS variables
│   │   ├── test-utils/        # Testing utilities
│   │   ├── types/             # Common TypeScript types
│   │   └── validation/        # Zod schemas
│   │
│   └── lib/                   # Core utilities
│       ├── database.types.ts  # Supabase type definitions
│       ├── supabase.ts        # Supabase client
│       └── utils.ts           # Helper functions
│
├── public/                    # Static assets
│   ├── pwa-*.svg             # PWA icons
│   └── offline.html          # Offline fallback
│
├── PRPs/                      # Product Requirement Prompts
│   ├── templates/             # PRP templates
│   ├── ai_docs/              # AI context documentation
│   └── *.md                  # Feature PRPs
│
├── claude_md_files/           # Development documentation
│   ├── CLAUDE-REACT.md       # React best practices
│   ├── DATABASE-SCHEMA.md    # Database structure
│   └── *.md                  # Various guides
│
├── supabase/                  # Database migrations
│   └── migrations/            # SQL migration files
│
├── Configuration Files
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config
├── eslint.config.js          # ESLint rules
├── tailwind.config.js        # Tailwind CSS config
├── vitest.config.ts          # Test configuration
└── package.json              # Dependencies & scripts
```

### Key Directory Purposes

- **`src/app/`**: Application shell, routing, and page components
- **`src/features/`**: Domain-specific functionality, self-contained modules
- **`src/shared/`**: Cross-cutting concerns, reusable components
- **`src/lib/`**: External service integrations, utilities
- **`PRPs/`**: Detailed implementation specifications for AI-assisted development
- **`claude_md_files/`**: Knowledge base for development patterns and decisions

## 3. Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Supabase Account**: For backend services (optional for basic development)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kuebic/hsa-songbook.git
   cd hsa-songbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

   > **Note**: You can run the app without Supabase for UI development, but API features won't work.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint checks
npm run test          # Run tests with Vitest
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
npm run analyze       # Analyze bundle size
```

### Validation Checks

Before committing code, ensure it passes all validation levels:

```bash
# Level 1: Syntax & Type Checking
npm run lint && npm run build

# Level 2: Development Server
npm run dev
# Verify no console errors

# Level 3: Test Suite
npm run test

# Level 4: Production Build
npm run build && npm run preview
```

## 4. Key Components

### Entry Points

#### `src/app/main.tsx` (Application Entry)
- Sets up React Query client with retry logic
- Configures global error boundaries
- Applies theme and global styles
- Mounts the React app

#### `src/app/App.tsx` (Main Router)
- Defines all application routes
- Implements code splitting with lazy loading
- Wraps routes with error boundaries
- Provides global contexts (Theme, Auth, Notifications)

### Core Business Logic

#### Song Management (`src/features/songs/`)
- **Components**: `SongCard`, `SongList`, `SongManagementForm`
- **Hooks**: `useSongs`, `useSongMutations`, `useArrangements`
- **Services**: `songService.ts`, `arrangementService.ts`
- **Key Pattern**: Optimistic updates with React Query

#### ChordPro Editor (`src/features/arrangements/`)
- **Components**: `ChordProEditor`, `PreviewPane`, `TransposeBar`
- **Hooks**: `useAutoSave`, `useTransposition`, `useEditorState`
- **Services**: `chordProService.ts`, `EditorStorageService.ts`
- **Key Features**: 
  - Three-tier auto-save (memory → session → IndexedDB)
  - Real-time preview with syntax highlighting
  - Smart transposition with enharmonic preferences

#### Authentication (`src/features/auth/`)
- **Components**: `ProtectedRoute`, `UserMenu`, `EmailAuthForm`
- **Context**: `AuthContext` for global auth state
- **Services**: Supabase Auth integration
- **Roles**: Public, User, Moderator, Admin

### Database Integration

#### Supabase Client (`src/lib/supabase.ts`)
- Configured client with auto-refresh tokens
- Helper functions for auth operations
- Development logging for debugging

#### Type Definitions (`src/lib/database.types.ts`)
- Auto-generated TypeScript types from Supabase
- Complete type safety for database operations
- Keep updated with: `npx supabase gen types typescript`

## 5. Development Workflow

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes following conventions**
   - Use functional components with hooks
   - Apply TypeScript types everywhere
   - Follow existing code patterns

3. **Test your changes**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

4. **Commit with descriptive messages**
   ```bash
   git add .
   git commit -m "feat: add song export functionality"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

#### TypeScript
- **Strict mode enabled** - no implicit any
- **Interfaces over types** for object shapes
- **Explicit return types** for functions
- **Props interfaces** for all components

#### React Patterns
- **Functional components** with hooks
- **Custom hooks** prefixed with `use`
- **Memoization** with useMemo/useCallback when needed
- **Error boundaries** at page and feature levels

#### File Naming
- **Components**: PascalCase (`SongCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSongData.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Styles**: CSS modules (`SongCard.module.css`)

#### CSS & Styling
- **Tailwind utilities** for common styles
- **CSS modules** for component-specific styles
- **CSS variables** for theme values
- **Mobile-first** responsive design

### Testing Strategy

#### Unit Tests
- Test individual functions and hooks
- Mock external dependencies
- Focus on business logic

#### Component Tests
- Test user interactions
- Verify rendered output
- Check accessibility

#### Integration Tests
- Test feature workflows
- Verify API interactions
- Check error handling

## 6. Architecture Decisions

### Feature-First Architecture
**Why**: Promotes modularity and team scalability
- Each feature is self-contained with its own components, hooks, and services
- Easy to understand ownership and dependencies
- Supports parallel development

### Three-Tier Storage System
**Why**: Maximum data resilience
1. **Memory State**: Immediate updates
2. **Session Storage**: Tab-specific recovery
3. **IndexedDB**: Persistent storage with compression

### Optimistic Updates
**Why**: Better perceived performance
- UI updates immediately on user action
- Rollback on server error
- Implemented via React Query mutations

### CSS Modules + Tailwind
**Why**: Best of both worlds
- Tailwind for rapid prototyping and utilities
- CSS Modules for component encapsulation
- Prevents style conflicts

### Lazy Loading Routes
**Why**: Faster initial load
- Code splitting at route level
- Reduced initial bundle size
- Better performance metrics

### PRP-Driven Development
**Why**: AI-assisted development efficiency
- Structured prompts for consistent implementation
- Comprehensive context for one-pass success
- Self-validating with test gates

## 7. Common Tasks

### Adding a New API Endpoint

1. **Update database types** if schema changed
   ```bash
   npx supabase gen types typescript > src/lib/database.types.ts
   ```

2. **Create service function**
   ```typescript
   // src/features/songs/services/songService.ts
   export const createSong = async (data: CreateSongData) => {
     const { data: song, error } = await supabase
       .from('songs')
       .insert(data)
       .select()
       .single()
     
     if (error) throw error
     return song
   }
   ```

3. **Create React Query hook**
   ```typescript
   // src/features/songs/hooks/useCreateSong.ts
   export const useCreateSong = () => {
     return useMutation({
       mutationFn: createSong,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['songs'] })
       }
     })
   }
   ```

### Creating a New Component

1. **Create component file**
   ```typescript
   // src/features/songs/components/SongCard.tsx
   interface SongCardProps {
     song: Song
     onEdit?: (song: Song) => void
   }
   
   export const SongCard: React.FC<SongCardProps> = ({ song, onEdit }) => {
     // Component logic
   }
   ```

2. **Add styles if needed**
   ```css
   /* src/features/songs/components/SongCard.module.css */
   .card {
     @apply rounded-lg shadow-md p-4;
   }
   ```

3. **Export from feature index**
   ```typescript
   // src/features/songs/index.ts
   export { SongCard } from './components/SongCard'
   ```

### Adding a Database Model

1. **Create migration in Supabase Dashboard**
2. **Update local types**
3. **Create service layer**
4. **Add hooks for data fetching**
5. **Build UI components**

### Implementing a New Feature

1. **Create PRP document** in `PRPs/` folder
2. **Create feature folder** in `src/features/`
3. **Implement core logic** in services
4. **Build React hooks** for state management
5. **Create UI components**
6. **Add tests**
7. **Update routing** if needed

## 8. Potential Gotchas

### Environment Variables
- **Issue**: App crashes with "Missing Supabase environment variables"
- **Solution**: Ensure `.env` file exists with valid credentials
- **Note**: Variables must be prefixed with `VITE_` to be accessible

### PWA Currently Disabled
- **Issue**: PWA features don't work
- **Status**: Set `ENABLE_PWA = false` in `vite.config.ts`
- **To Enable**: Change to `true` and rebuild

### TypeScript Strict Mode
- **Issue**: Type errors that seem unnecessary
- **Reason**: Strict mode is enabled for better type safety
- **Solution**: Explicitly type everything, avoid `any`

### Supabase Authentication
- **Issue**: Auth operations fail silently
- **Debug**: Check browser console for Supabase logs
- **Common Fix**: Ensure correct project URL and anon key

### CSS Module Imports
- **Issue**: Styles not applying
- **Solution**: Import as `styles` and use `styles.className`
  ```typescript
  import styles from './Component.module.css'
  <div className={styles.container}>
  ```

### React Query Stale Time
- **Default**: 5 minutes stale time
- **Impact**: Data may not refresh immediately
- **Override**: Use `staleTime: 0` for real-time data

### Bundle Size
- **Monitor**: Run `npm run analyze` to check bundle size
- **Large Dependencies**: Consider dynamic imports for heavy libraries
- **Tree Shaking**: Ensure proper ES module imports

### Database Types Out of Sync
- **Symptom**: TypeScript errors after database changes
- **Fix**: Regenerate types from Supabase
  ```bash
  npx supabase gen types typescript > src/lib/database.types.ts
  ```

### Session Storage Conflicts
- **Issue**: Multiple tabs interfering with each other
- **Reason**: Session storage is tab-specific
- **Design**: This is intentional for draft isolation

### Mobile Viewport Issues
- **Common**: Toolbar covering content
- **Solution**: Use `CollapsibleToolbar` component
- **Test**: Always test on actual devices

## 9. Documentation and Resources

### Internal Documentation
- **`README.md`**: Project overview and quick start
- **`CLAUDE.md`**: AI assistant context and patterns
- **`PRPs/`**: Detailed feature specifications
- **`claude_md_files/`**: Architecture decisions and guides

### External Resources
- [ChordSheetJS Documentation](https://github.com/martijnversluis/ChordSheetJS)
- [Supabase Documentation](https://supabase.com/docs)
- [React Router v7](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Documentation](https://vite.dev)

### API Documentation
- Database schema in `src/lib/database.types.ts`
- Service layer documentation in feature folders
- REST endpoints documented in PRPs

### Team Resources
- GitHub Issues: Bug reports and feature requests
- PRP Templates: For new feature development
- Code Reviews: Follow patterns in existing code

## 10. Onboarding Checklist

### Day 1: Environment Setup
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Set up `.env` file
- [ ] Run development server successfully
- [ ] Browse the application locally

### Day 2: Understand the Codebase
- [ ] Read through this onboarding guide
- [ ] Explore the feature folders
- [ ] Understand the routing structure
- [ ] Review TypeScript types
- [ ] Check out the PRP documentation

### Day 3: Make Your First Change
- [ ] Create a feature branch
- [ ] Make a small UI change (e.g., update text)
- [ ] Run linting and tests
- [ ] Build the project
- [ ] Commit your change

### Week 1: Deep Dive
- [ ] Understand the ChordPro editor
- [ ] Learn the song management flow
- [ ] Explore the authentication system
- [ ] Review the database schema
- [ ] Try adding a simple feature

### Ongoing: Best Practices
- [ ] Follow code style guidelines
- [ ] Write tests for new features
- [ ] Update documentation
- [ ] Participate in code reviews
- [ ] Use PRPs for complex features

## Getting Help

### Common Issues
1. **Check this guide** for potential gotchas
2. **Search existing issues** on GitHub
3. **Review PRPs** for implementation details
4. **Check test files** for usage examples

### Debugging Tips
- Use React DevTools for component inspection
- Check Network tab for API calls
- Enable Supabase debug logging in development
- Use `console.log` strategically (remove before commit)

### Contact
- Create an issue on GitHub for bugs
- Discuss features in GitHub Discussions
- Check team documentation in `PRPs/ai_docs/`

---

Welcome to the team! We're excited to have you contributing to HSA Songbook. This project serves an important community need, and your contributions will directly impact worship experiences worldwide.

Remember: When in doubt, look at existing code patterns, check the PRPs, and don't hesitate to ask questions!