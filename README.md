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
- **Undo/Redo**: Robust command pattern implementation with configurable history (in the works)
- **Syntax Highlighting**: CodeMirror-powered editor with ChordPro syntax support
- **Music-Based Transpose**: Intelligent transposition using musical relationships, not simple math (in the works)
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

### Backend (Optional)
- **API**: Express server with MongoDB
- **Database**: MongoDB with optimized schema
- **Authentication**: Clerk integration

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
npm run dev:full
```

The app will be available at `http://localhost:5173`

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

### Development with Backend

To run the full stack application:

```bash
npm run install:all   # Install frontend and backend dependencies
npm run dev:full      # Start both frontend and backend servers
```

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
├── server/               # Backend API (optional)
├── public/               # Static assets and PWA icons
├── PRPs/                 # Project requirement documents
└── claude_md_files/      # Development documentation
```

## Key Features Implementation

### Command Pattern for Undo/Redo
The editor implements a sophisticated command pattern with:
- Configurable history size (default: 100 commands)
- Command merging within time windows (500ms)
- Support for INSERT_TEXT, DELETE_TEXT, REPLACE_TEXT operations

### Auto-Save Architecture
Three-tier storage system ensures data persistence:
1. **Memory State**: Immediate command history
2. **Session Storage**: Tab-specific recovery
3. **IndexedDB**: Persistent storage with compression

### Music-Based Transposition
Intelligent transpose that understands music theory:
- Maintains proper key signatures
- Preserves chord qualities (major/minor)
- Smart enharmonic choices (C# vs Db)
- Circle of fifths navigation

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
