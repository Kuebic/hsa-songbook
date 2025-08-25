# HSA Songbook

A modern, responsive web application for searching, viewing, and managing worship songs with ChordPro. Built for Unficationist musicians and worship leaders to easily organize chord charts and create setlists for performances.

## Features

### 🎵 Core Functionality
- **Song Library**: Browse and search through a comprehensive collection of worship songs
- **ChordPro Support**: Full parsing and rendering of ChordPro formatted songs using ChordSheetJS
- **Smart Search**: Fast full-text search across titles, artists, and lyrics (< 500ms response time)
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices

### ✏️ ChordPro Editor
- **Live Preview**: Split-screen editor with real-time ChordPro rendering
- **Auto-Save**: Three-tier storage system with automatic saving every 30 seconds
- **Syntax Highlighting**: CodeMirror-powered editor with ChordPro syntax support
- **Transpose**: Simple semitone-based transposition using ChordSheetJS
- **Directive Support**: Full support for ChordPro directives ({title}, {key}, {tempo}, etc.)

### 📋 Setlist Management
- **Drag & Drop**: Intuitive song ordering with @dnd-kit
- **Playback Mode**: Full-screen navigation through setlist songs
- **Sharing**: Generate public URLs for setlist access
- **Export Options**: Print-friendly formats and PDF generation

### 📱 Progressive Web App
- **Offline Support**: Access songs and setlists without internet connection
- **Smart Caching**: Frequently accessed content stored locally with IndexedDB
- **Install Prompt**: Add to home screen for app-like experience
- **Background Sync**: Automatic synchronization when reconnected

### 🔐 User Management
- **Authentication**: Secure login via Clerk
- **Role-Based Access**: Public, User, and Admin permission levels
- **Personal Library**: Save and manage personal setlists

## Tech Stack

### Frontend
- **Framework**: React 19.1 with TypeScript 5.8
- **Build Tool**: Vite 7.0 for fast development and optimized builds
- **Styling**: Tailwind CSS 4.1 with ShadCN UI components
- **State Management**: TanStack Query v5 for server state, React Context for client state
- **Routing**: React Router v7 with lazy loading
- **Editor**: CodeMirror v6 for ChordPro editing

### Storage & Performance
- **Offline Storage**: IndexedDB with idb 8.0 wrapper
- **Compression**: LZ-String for 60-80% data size reduction
- **PWA**: Vite PWA plugin with Workbox
- **Performance**: < 3s initial load, < 100ms route changes

### Backend
- **Database**: Supabase (PostgreSQL)
- **Migrations**: Version-controlled SQL migrations
- **Type Safety**: Auto-generated TypeScript types from schema

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kuebic/hsa-songbook.git
cd hsa-songbook
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional for full features):
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🚀 Local Development

### Quick Setup

Get started with local Supabase development in minutes:

```bash
# One-time setup (installs Supabase CLI and starts services)
./scripts/setup-local.sh

# Daily development
npm run dev:local
```

This starts both the Vite dev server and local Supabase services. See [QUICKSTART.md](docs/QUICKSTART.md) for detailed setup instructions.

### Environment Configuration

The project uses different environment files for different stages:

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Template with all variables | ✅ Yes |
| `.env.local` | Local development | ❌ No |
| `.env.staging` | Staging environment | ❌ No |
| `.env.production` | Production environment | ❌ No |

### Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev:local` | Start app with local Supabase |
| `npm run supabase:status` | Check Supabase service status |
| `npm run supabase:stop` | Stop Supabase services |
| `npm run db:reset` | Reset database with seed data |
| `npm run db:migrate` | Apply pending migrations |
| `npm run types:generate` | Update TypeScript types from schema |

### Local Supabase Services

When running locally, you have access to:

- **PostgreSQL Database**: Port 54322
- **Supabase Studio** (Database GUI): http://localhost:54323
- **Supabase API**: Port 54321
- **Email Testing** (Inbucket): http://localhost:54324
- **S3-compatible Storage**: Port 54320

All data is stored in Docker volumes and persists between sessions.

### Database Management

We use Supabase for our backend with version-controlled migrations:

- **Migrations**: Stored in `supabase/migrations/`
- **Seed Data**: Automatically loaded on reset
- **Type Safety**: Auto-generated TypeScript types
- **Studio Access**: Visual database management at http://localhost:54323

See [Database Workflows](docs/WORKFLOWS.md#database) for detailed procedures.

### Available Scripts

```bash
npm run dev           # Start development server with hot reload
npm run build         # Build for production
npm run preview       # Preview production build locally
npm run lint          # Run ESLint
npm run test          # Run test suite with Vitest
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate test coverage report
```

## Database Migrations

The project uses Supabase for the backend with version-controlled database migrations.

### Migration Commands

```bash
# Database operations
npm run db:reset      # Reset database to fresh state with all migrations
npm run db:migrate    # Apply pending migrations
npm run db:diff       # Generate migration from schema changes
npm run db:push       # Push migrations to remote database

# Type generation
npm run types:generate # Generate TypeScript types from database schema

# Migration helpers
npm run migrate:up    # Apply migrations with type generation
npm run migrate:down  # Create rollback migration
npm run migrate:test  # Test all migrations on fresh database
```

### Working with Migrations

1. **Create a new migration:**
```bash
supabase migration new your_feature_name
# Edit the created file in supabase/migrations/
```

2. **Test locally:**
```bash
npm run db:reset       # Apply all migrations including new one
npm run types:generate # Update TypeScript types
```

3. **Rollback if needed:**
```bash
npm run migrate:down 20250121000000_your_migration.sql
# Edit the generated rollback file
npm run db:reset
```

For detailed migration documentation, see [supabase/migrations/README.md](supabase/migrations/README.md).

## Project Structure

```
hsa-songbook/
├── src/
│   ├── app/              # Application entry, routing, pages
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── features/         # Feature modules
│   │   ├── arrangements/ # ChordPro editor and viewer
│   │   ├── auth/         # Authentication with Clerk
│   │   ├── songs/        # Song management
│   │   ├── setlists/     # Setlist features
│   │   ├── search/       # Search functionality
│   │   ├── pwa/          # Progressive web app features
│   │   └── monitoring/   # Error tracking and analytics
│   ├── shared/           # Shared resources
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── styles/       # Global styles
│   │   └── validation/   # Zod schemas
│   └── lib/              # Utility functions
├── public/               # Static assets and PWA icons
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migration files
│   ├── functions/        # Edge functions
│   └── seed.sql          # Development seed data
├── scripts/              # Build and utility scripts
├── PRPs/                 # Project requirement documents
└── claude_md_files/      # Development documentation
```

## Key Features Implementation


### Auto-Save Architecture
Three-tier storage system ensures data persistence:
1. **Memory State**: Current editor content
2. **Session Storage**: Tab-specific recovery
3. **IndexedDB**: Persistent storage with compression

### Transposition
Standard semitone-based transposition:
- Shift chords up/down by semitones
- Basic enharmonic preference (sharp/flat)
- Powered by ChordSheetJS library

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 3s | ✅ |
| Search Response | < 500ms | ✅ |
| Route Changes | < 100ms | ✅ |
| Bundle Size | < 200KB | ✅ |
| Test Coverage | > 80% | 🚧 |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

We welcome contributions! Please see our contributing guidelines for details.

### Development Workflow
1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Run tests and linting: `npm run lint && npm run test`
4. Submit a pull request with a clear description

### Code Style
- TypeScript with strict mode enabled
- Functional components with hooks
- ESLint configuration for consistent code
- Prettier for code formatting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) for ChordPro parsing
- [Clerk](https://clerk.com) for authentication
- [ShadCN UI](https://ui.shadcn.com) for UI components
- [TanStack Query](https://tanstack.com/query) for data fetching

## Support

For issues, questions, or suggestions, please [open an issue](https://github.com/Kuebic/hsa-songbook/issues) on GitHub.

---

*Built with ❤️ for the Unfication community*
