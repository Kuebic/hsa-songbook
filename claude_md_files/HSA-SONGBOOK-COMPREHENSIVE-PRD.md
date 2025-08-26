# HSA Songbook - Comprehensive Product Requirements Document

## Executive Summary

HSA Songbook is a full-stack Progressive Web Application (PWA) designed for musicians and worship leaders to manage, view, and organize chord charts using the ChordPro format. The application provides real-time chord transposition, setlist management, collaborative features, and works offline-first with sophisticated caching strategies.

## 1. Technical Architecture

### 1.1 Technology Stack

#### Frontend
- **Framework**: React 19.1 with TypeScript 5.8
- **Build Tool**: Vite 7.0 with HMR and PWA plugin
- **State Management**: TanStack Query v5 for server state, React Context for local state
- **Styling**: Tailwind CSS v4 with custom theme system
- **Editor**: CodeMirror v6 for ChordPro editing with custom syntax highlighting
- **ChordPro Parsing**: ChordSheetJS v12 for rendering chord charts
- **Authentication**: Supabase Auth for user management
- **Routing**: React Router v7
- **PWA**: Vite PWA plugin with Workbox for offline support
- **Testing**: Vitest with React Testing Library

#### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Compression**: ZSTD for chord data storage optimization
- **Authentication**: Supabase Auth with JWT tokens
- **API Design**: RESTful with versioning (/api/v1)
- **Security**: Helmet, CORS, rate limiting, input sanitization

### 1.2 Architecture Patterns

#### Frontend Architecture
```
src/
├── app/                    # Application core
│   ├── pages/             # Route pages (lazy loaded)
│   └── App.tsx            # Main app with routing
├── features/              # Feature-based modules
│   ├── arrangements/      # Chord editing & viewing
│   ├── auth/             # Authentication components
│   ├── monitoring/       # Error boundaries & analytics
│   ├── pwa/             # PWA components & offline
│   ├── search/          # Search functionality
│   ├── setlists/        # Setlist management
│   └── songs/           # Song CRUD operations
├── shared/              # Shared resources
│   ├── components/      # Reusable UI components
│   ├── contexts/        # Global React contexts
│   ├── styles/          # Global styles
│   └── validation/      # Zod schemas
```

#### Backend Architecture
```
server/
├── features/            # Domain-driven modules
│   ├── arrangements/    # Arrangement CRUD
│   ├── reviews/        # Rating system
│   ├── songs/          # Song management
│   └── users/          # User management
├── shared/             # Cross-cutting concerns
│   ├── config/         # Environment config
│   ├── middleware/     # Express middleware
│   └── services/       # Shared services
```

## 2. Data Models

### 2.1 Core Entities

#### Song Model
```typescript
{
  title: string (required, max: 200)
  artist: string (max: 100)
  slug: string (unique, indexed)
  compositionYear: number (1000-current)
  ccli: string (indexed, sparse)
  themes: string[] (lowercase tags)
  source: string (max: 200)
  notes: string (max: 2000)
  defaultArrangementId: ObjectId
  metadata: {
    createdBy: string (Supabase user ID)
    lastModifiedBy: string
    isPublic: boolean
    ratings: { average: number, count: number }
    views: number
  }
  timestamps: true
}
```

#### Arrangement Model
```typescript
{
  name: string (required, max: 200)
  songIds: ObjectId[] (references to songs)
  slug: string (unique, indexed)
  createdBy: string (Supabase user ID)
  chordData: Buffer (ZSTD compressed ChordPro)
  key: enum ['C','C#','Db',...,'B']
  tempo: number (40-240 BPM)
  timeSignature: enum ['4/4','3/4',...]
  difficulty: enum ['beginner','intermediate','advanced']
  description: string (max: 1000)
  tags: string[]
  metadata: {
    isMashup: boolean
    mashupSections: Array
    isPublic: boolean
    ratings: { average: number, count: number }
    views: number
  }
  timestamps: true
}
```

#### Setlist Model (Frontend IndexedDB)
```typescript
{
  id: string (nanoid)
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  createdBy: string (optional Supabase user ID)
  isPublic: boolean
  shareId: string (for sharing)
  arrangements: Array<{
    id: string
    order: number
    customKey?: string
    notes?: string
  }>
  metadata: {
    songCount: number
    estimatedDuration: number
    tags: string[]
  }
}
```

### 2.2 Database Design Decisions

1. **Separation of Songs and Arrangements**: Allows multiple arrangements per song
2. **ZSTD Compression**: Reduces MongoDB storage by ~70% for chord data
3. **Slug-based URLs**: SEO-friendly and shareable links
4. **Sparse Indexes**: Optimizes queries for optional fields like CCLI
5. **Text Indexes**: Enables full-text search across titles, artists, themes

## 3. Core Features

### 3.1 ChordPro Editor & Viewer

#### Editor Features
- **Syntax Highlighting**: Custom CodeMirror mode for ChordPro
- **Auto-completion**: Chord suggestions and ChordPro directives
- **Bracket Matching**: Auto-close brackets for chords
- **Real-time Preview**: Split-pane with synchronized scrolling
- **Mobile Optimization**: Touch-friendly with virtual keyboard support
- **Auto-save**: Debounced saving to localStorage
- **Session Recovery**: Restore unsaved changes after browser crash
- **Undo/Redo**: Command pattern implementation with history

#### Viewer Features
- **Multiple Rendering Modes**: Text, chord charts, Nashville notation
- **Transposition**: Real-time key changes with enharmonic preferences
- **Theme Support**: Light, dark, high-contrast, sepia modes
- **Font Preferences**: Size, family, line height controls
- **Stage Mode**: Fullscreen, minimal UI for performance
- **Print Support**: Optimized CSS for paper output
- **Responsive Layout**: Adapts to screen size with column support

### 3.2 Search & Discovery

#### Search Implementation
- **Instant Search**: Debounced input with TanStack Query
- **Faceted Filtering**: Key, tempo, difficulty, tags
- **Search Suggestions**: Fuzzy matching with weighted scoring
- **Recent Searches**: Stored in localStorage
- **Search Analytics**: Track popular searches (backend)

### 3.3 Setlist Management

#### Core Functionality
- **Drag & Drop**: DnD Kit for reordering songs
- **Offline Storage**: IndexedDB with background sync
- **Sharing**: Unique share IDs for public access
- **Playback Mode**: Fullscreen navigation through setlist
- **Key Planning**: Set custom keys per song in setlist
- **Export**: PDF, plain text, ChordPro bundle
- **Collaborative**: Real-time updates (future feature)

### 3.4 Progressive Web App

#### PWA Features
- **Offline Support**: Cache-first strategy for static assets
- **Background Sync**: Queue mutations when offline
- **Install Prompt**: Custom install experience
- **Update Prompt**: Notify users of new versions
- **Push Notifications**: For setlist shares (future)
- **Share Target**: Accept shared songs/setlists

## 4. API Specification

### 4.1 RESTful Endpoints

#### Songs API
```
GET    /api/v1/songs           - List songs (paginated)
GET    /api/v1/songs/:slug     - Get song by slug
POST   /api/v1/songs           - Create song (auth required)
PUT    /api/v1/songs/:id       - Update song (auth required)
DELETE /api/v1/songs/:id       - Delete song (auth required)
GET    /api/v1/songs/search    - Search songs
```

#### Arrangements API
```
GET    /api/v1/arrangements              - List arrangements
GET    /api/v1/arrangements/:slug        - Get arrangement
POST   /api/v1/arrangements              - Create arrangement
PUT    /api/v1/arrangements/:id          - Update arrangement
DELETE /api/v1/arrangements/:id          - Delete arrangement
GET    /api/v1/arrangements/song/:songId - Get by song
POST   /api/v1/arrangements/:id/rate     - Rate arrangement
```

#### Users API
```
POST   /api/v1/auth/callback   - Supabase auth callback handler
GET    /api/v1/users/profile   - Get user profile
PUT    /api/v1/users/profile   - Update profile
```

### 4.2 Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    pagination?: { page, limit, total, pages }
    cached?: boolean
  }
}

// Error Response
{
  success: false,
  error: {
    message: string,
    code: string,
    details?: any
  }
}
```

## 5. User Interface Design

### 5.1 Design System

#### Colors (CSS Variables)
```css
--color-background: theme-aware
--color-foreground: theme-aware
--color-primary: blue-600
--color-secondary: gray-600
--color-accent: amber-500
--color-danger: red-600
--color-success: green-600
```

#### Typography
- **Font**: System font stack with fallbacks
- **Sizes**: Fluid typography with clamp()
- **Line Heights**: Optimized for readability

#### Components
- **Buttons**: Primary, secondary, ghost, danger variants
- **Forms**: Floating labels, inline validation
- **Cards**: Consistent padding, hover states
- **Modals**: Trap focus, backdrop, animations
- **Notifications**: Toast-style with auto-dismiss

### 5.2 Responsive Breakpoints
- **Mobile**: < 640px (single column)
- **Tablet**: 640px - 1024px (two columns)
- **Desktop**: > 1024px (multi-column, sidebars)

### 5.3 Accessibility
- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Tab order, shortcuts
- **Screen Readers**: Semantic HTML, live regions
- **Color Contrast**: WCAG AA compliance
- **Focus Indicators**: Visible focus rings

## 6. Performance Requirements

### 6.1 Frontend Performance
- **Initial Load**: < 3s on 3G
- **Time to Interactive**: < 5s
- **Code Splitting**: Route-based lazy loading
- **Bundle Size**: < 500KB initial JS
- **Image Optimization**: WebP with fallbacks

### 6.2 Backend Performance
- **API Response**: < 200ms p95
- **Database Queries**: Indexed, < 100ms
- **Compression**: 70% reduction in storage
- **Rate Limiting**: 100 req/min per IP
- **Caching**: Redis for hot data (future)

## 7. Security Requirements

### 7.1 Authentication & Authorization
- **Provider**: Supabase Auth with JWT tokens
- **Roles**: Public, User, Admin
- **Session**: Secure, httpOnly cookies
- **OAuth**: Google, GitHub providers

### 7.2 Data Protection
- **Input Sanitization**: MongoDB injection prevention
- **XSS Prevention**: React's built-in escaping
- **CORS**: Whitelist allowed origins
- **Rate Limiting**: Prevent abuse
- **HTTPS**: Required in production

## 8. Development Workflow

### 8.1 Commands
```bash
# Development
npm run dev              # Start frontend dev server
npm run dev:server       # Start backend dev server
npm run dev:full         # Start both concurrently

# Building
npm run build           # Build frontend
npm run build:server    # Build backend

# Testing
npm run test            # Run tests
npm run test:coverage   # With coverage
npm run lint            # ESLint check

# Deployment
npm run preview         # Preview production build
```

### 8.2 Environment Variables

#### Frontend (.env)
```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:3001
```

#### Backend (.env)
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hsa-songbook
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
```

## 9. Testing Strategy

### 9.1 Frontend Testing
- **Unit Tests**: Components with React Testing Library
- **Integration**: User flows with MSW mocking
- **Accessibility**: jest-axe for a11y testing
- **Visual Regression**: Future implementation

### 9.2 Backend Testing
- **Unit Tests**: Services and utilities
- **Integration**: API endpoints with supertest
- **Database**: In-memory MongoDB for tests
- **Load Testing**: Future implementation

## 10. Deployment Architecture

### 10.1 Infrastructure
- **Frontend**: Static hosting (Vercel/Netlify)
- **Backend**: Node.js server (Railway/Render)
- **Database**: MongoDB Atlas free tier
- **CDN**: Cloudflare for static assets

### 10.2 CI/CD Pipeline
1. GitHub Actions on push to main
2. Run tests and linting
3. Build and optimize
4. Deploy to staging
5. Manual promotion to production

## 11. Future Enhancements

### Phase 2 Features
- Real-time collaboration on setlists
- Audio playback with sync
- Chord diagram generation
- MIDI export/import
- Mobile native apps
- Multi-language support

### Phase 3 Features
- AI-powered chord suggestions
- Social features (follow, share)
- Marketplace for arrangements
- Analytics dashboard
- Webhook integrations
- GraphQL API option

## 12. Success Metrics

### User Metrics
- Daily Active Users (DAU)
- Session duration
- Songs viewed per session
- Setlists created
- Arrangement contributions

### Technical Metrics
- Page load time
- API response time
- Error rate
- Offline usage
- PWA installation rate

## 13. Implementation Notes

### Critical Implementation Details

1. **ChordPro Rendering**: Use ChordSheetJS with custom renderer for alignment
2. **Transposition**: Musical-interval based, not simple string replacement
3. **Offline Sync**: Queue mutations in IndexedDB, replay when online
4. **Compression**: ZSTD provides better ratios than gzip for text
5. **Search**: MongoDB text indexes with weighted fields
6. **Authentication**: Supabase Auth for user sync
7. **State Management**: TanStack Query for server state, avoid Redux
8. **Testing**: Focus on user flows, not implementation details
9. **Performance**: Virtualize long lists, debounce user input
10. **Accessibility**: Test with screen readers, keyboard-only navigation

### Common Pitfalls to Avoid

1. Don't store uncompressed chord data (storage costs)
2. Don't forget to index database queries
3. Don't skip loading states (poor UX)
4. Don't ignore mobile users (60% of traffic)
5. Don't hardcode configuration values
6. Don't skip error boundaries
7. Don't forget CORS configuration
8. Don't use synchronous operations in API
9. Don't skip input validation
10. Don't forget to handle offline scenarios

## Conclusion

This PRD provides a comprehensive blueprint for recreating the HSA Songbook application. The key to success is maintaining the balance between feature richness and performance, while ensuring the application works reliably offline and provides an excellent user experience across all devices.