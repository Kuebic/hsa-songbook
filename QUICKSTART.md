# HSA Songbook - Quick Start Guide

Get the HSA Songbook running on your machine in 5 minutes!

## Prerequisites
- Node.js 18+ and npm
- Git

## Setup Steps

### 1. Clone & Install
```bash
git clone https://github.com/Kuebic/hsa-songbook.git
cd hsa-songbook
npm install
```

### 2. Configure Environment (Optional)
For full functionality with backend:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

> **Note**: You can skip this step to run UI-only development

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser

## Essential Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Check code quality
npm run test       # Run tests
npm run preview    # Preview production build
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

### "Missing Supabase environment variables"
→ Create `.env` file with Supabase credentials or run without backend features

### Styles not applying
→ Import CSS modules correctly: `import styles from './Component.module.css'`

### TypeScript errors
→ Project uses strict mode - explicitly type everything

### Build failures
→ Run `npm run lint` first to catch issues early

## Need More Help?

- **Full Documentation**: See [ONBOARDING.md](./ONBOARDING.md)
- **Architecture Details**: Check `claude_md_files/` folder
- **Feature Specs**: Browse `PRPs/` folder
- **Report Issues**: GitHub Issues

## Ready to Code!

You're all set! The dev server is running, and you can start making changes. The app will hot-reload as you save files.

Happy coding! 🚀