# 🚀 HSA Songbook - Quick Start Guide

Get up and running with local Supabase development in 5 minutes!

## Prerequisites

You need just 2 things:

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
   - macOS/Windows: Install Docker Desktop
   - Linux: Install Docker Engine
   
2. **Node.js 18+** - [Download here](https://nodejs.org/)
   - Verify with: `node --version`

## Setup Options

### Option A: Full Local Development (Recommended)

#### 1. Clone & Install
```bash
git clone https://github.com/Kuebic/hsa-songbook.git
cd hsa-songbook
npm install
```

#### 2. Setup Local Supabase
```bash
# One-time setup (installs Supabase CLI, starts services)
./scripts/setup-local.sh
```

#### 3. Start Development
```bash
npm run dev:local
```

Your app is ready at:
- ✅ **App**: http://localhost:5173
- ✅ **Supabase Studio**: http://localhost:54323
- ✅ **Sample data**: Pre-loaded in database

### Option B: UI-Only Development

For frontend-only work without database:

```bash
git clone https://github.com/Kuebic/hsa-songbook.git
cd hsa-songbook
npm install
npm run dev
```

Open http://localhost:5173 in your browser

## Essential Commands

### Daily Development
```bash
npm run dev:local          # Start with local Supabase
npm run dev                # Start without database
npm run supabase:status    # Check service status
npm run supabase:stop      # Stop Supabase services
```

### Database Management
```bash
npm run db:reset           # Reset database with seed data
npm run db:migrate         # Apply pending migrations
npm run types:generate     # Update TypeScript types
```

### Code Quality
```bash
npm run lint               # Check code quality
npm run test               # Run tests
npm run build              # Build for production
npm run preview            # Preview production build
```

## Quick Validation
Before committing:
```bash
npm run lint && npm run build
```

## Project Structure at a Glance

```
src/
├── app/           # App shell & routing
├── features/      # Feature modules (songs, auth, etc.)
├── shared/        # Shared components & utilities
└── lib/           # External integrations (Supabase)
```

## Making Your First Change

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Find the relevant feature folder**
   - Songs → `src/features/songs/`
   - ChordPro Editor → `src/features/arrangements/`
   - Auth → `src/features/auth/`

3. **Make changes following existing patterns**

4. **Test your changes**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: your change description"
   ```

## Common Tasks

### Add a new page
1. Create component in `src/app/pages/`
2. Add route in `src/app/App.tsx`

### Add a new component
1. Create in relevant feature folder
2. Export from feature's `index.ts`

### Modify styles
- Use Tailwind classes for utilities
- CSS modules for component-specific styles

### Work with the database
1. Check types in `src/lib/database.types.ts`
2. Use service functions in feature folders
3. Create React Query hooks for data fetching

## Troubleshooting

### Docker Issues

#### "Docker daemon not running"
```bash
# Start Docker Desktop (macOS/Windows)
# Or on Linux:
sudo systemctl start docker
```

#### Port conflicts (54321 already in use)
```bash
# Stop existing Supabase
npm run supabase:stop

# Or find and kill process
lsof -i :54321
kill -9 <PID>
```

#### Permission denied on scripts
```bash
chmod +x scripts/*.sh
```

### Frontend Issues

#### "Missing Supabase environment variables"
→ Running locally? Use `npm run dev:local` instead of `npm run dev`

#### Styles not applying
→ Import CSS modules correctly: `import styles from './Component.module.css'`

#### TypeScript errors after database changes
```bash
npm run types:generate  # Regenerate types from database
```

#### Build failures
→ Run `npm run lint` first to catch issues early

## Need More Help?

- 📖 **Project Overview**: See [README.md](../README.md)
- 🎓 **Full Documentation**: See [ONBOARDING.md](./ONBOARDING.md)
- 🔧 **Troubleshooting Guide**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 💡 **Common Workflows**: [WORKFLOWS.md](./WORKFLOWS.md)
- ⚡ **Command Reference**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
- 🏗️ **Architecture Details**: Check `claude_md_files/` folder
- 📋 **Feature Specs**: Browse `PRPs/` folder
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/Kuebic/hsa-songbook/issues)

## Ready to Code!

You're all set! The dev server is running, and you can start making changes. The app will hot-reload as you save files.

Happy coding! 🚀