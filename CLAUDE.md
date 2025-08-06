# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Nature

This is a **React + TypeScript + Vite** application for HSA Songbook. The project uses modern React patterns with TypeScript for type safety and Vite for fast development and building.

## Additional Documentation

📚 **See `claude_md_files/` directory for comprehensive development guides:**
- Framework-specific best practices
- Detailed architectural patterns
- Testing strategies
- Performance optimization techniques
- Security requirements
- Code style guides

Review relevant files in that directory based on the technologies and patterns used in this project.

## Tech Stack

- **Frontend**: React 19.1 with TypeScript
- **Build Tool**: Vite 7.0
- **Language**: TypeScript 5.8
- **Package Manager**: npm
- **Linting**: ESLint 9 with React plugins
- **Module System**: ES Modules

## Project Structure

```
hsa-songbook/
├── src/                  # Source code
│   ├── App.tsx          # Main App component
│   ├── main.tsx         # Entry point
│   ├── assets/          # Static assets
│   └── index.css        # Global styles
├── public/              # Public static files
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
└── package.json         # Dependencies and scripts
```

## Development Commands

### Core Scripts

```bash
# Start development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Development Workflow

1. **Starting Development**: Always use `npm run dev` to start the development server
2. **Making Changes**: Vite provides hot module replacement (HMR) for instant feedback
3. **Type Checking**: TypeScript runs during build (`npm run build`)
4. **Linting**: Run `npm run lint` before committing

## Critical Success Patterns

### React Best Practices

1. **Component Structure**: Use functional components with hooks
2. **State Management**: Prefer useState, useReducer for local state
3. **Effects**: Use useEffect carefully with proper dependencies
4. **Memoization**: Apply useMemo/useCallback when necessary for performance

### TypeScript Conventions

- **Type Everything**: Explicitly type props, state, and function returns
- **Interfaces over Types**: Prefer interfaces for object shapes
- **Strict Mode**: tsconfig uses strict mode - no implicit any
- **Component Props**: Define Props interfaces for all components

### Code Style

- **File Naming**: Components in PascalCase (e.g., `SongList.tsx`)
- **Hook Files**: Custom hooks prefixed with `use` (e.g., `useSongData.ts`)
- **CSS Modules**: Use CSS modules for component-specific styles
- **Imports**: Use absolute imports from `src/` when possible

### Validation Gates (Must be Executable)

```bash
# Level 1: Syntax & Type Checking
npm run lint && npm run build

# Level 2: Development Server
npm run dev
# Verify no console errors

# Level 3: Production Build
npm run build && npm run preview
# Test production build locally
```

## Anti-Patterns to Avoid

- L Don't create minimal context prompts - context is everything - the PRP must be comprehensive and self-contained, reference relevant documentation and examples.
- L Don't skip validation steps - they're critical for one-pass success - The better The AI is at running the validation loop, the more likely it is to succeed.
- L Don't ignore the structured PRP format - it's battle-tested
- L Don't create new patterns when existing templates work
- L Don't hardcode values that should be config
- L Don't catch all exceptions - be specific

## Working with This Framework

### When Creating new PRPs

1. **Context Process**: New PRPs must consist of context sections, Context is King!
2.

### When Executing PRPs

1. **Load PRP**: Read and understand all context and requirements
2. **ULTRATHINK**: Create comprehensive plan, break down into todos, use subagents, batch tool etc check prps/ai_docs/
3. **Execute**: Implement following the blueprint
4. **Validate**: Run each validation command, fix failures
5. **Complete**: Ensure all checklist items done

### Command Usage

- Read the .claude/commands directory
- Access via `/` prefix in Claude Code
- Commands are self-documenting with argument placeholders
- Use parallel creation commands for rapid development
- Leverage existing review and refactoring commands

## Project Structure Understanding

```
PRPs-agentic-eng/
.claude/
  commands/           # 28+ Claude Code commands
  settings.local.json # Tool permissions
PRPs/
  templates/          # PRP templates with validation
  scripts/           # PRP runner and utilities
  ai_docs/           # Curated Claude Code documentation
   *.md               # Active and example PRPs
 claude_md_files/        # Framework-specific CLAUDE.md examples
```

Remember: This framework is about **one-pass implementation success through comprehensive context and validation**. Every PRP should contain the exact context for an AI agent to successfully implement working code in a single pass.
