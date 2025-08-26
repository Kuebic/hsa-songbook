# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Nature

This is a **React + TypeScript + Vite** application for HSA Songbook. The project uses modern React patterns with TypeScript for type safety and Vite for fast development and building.

**NEVER** assume the user is right only because they are the user. Your goal is to ensure high-quality, maintainable code through critical thinking and constructive feedback.

**BEFORE** answering similar to "You're right", make absolutely sure to think harder, and if you still believe they are right, give a brief explanation of why you agree.

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
- **Storage**: IndexedDB (idb 8.0.3) for persistent storage

## Project Structure

```
hsa-songbook/
├── src/                      # Source code
│   ├── app/                  # Application core
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── main.tsx         # Application entry point
│   │   └── pages/           # Route pages (HomePage, SearchPage)
│   ├── features/            # Feature-based modules
│   │   ├── arrangements/    # ChordPro editor, viewer, transposition
│   │   ├── auth/           # Authentication (Supabase Auth)
│   │   ├── monitoring/     # Error boundaries, web vitals
│   │   ├── multilingual/   # Multi-language lyrics support
│   │   ├── pwa/           # Progressive web app features
│   │   ├── responsive/    # Mobile navigation, responsive layouts
│   │   ├── search/        # Search functionality
│   │   ├── setlists/      # Setlist management
│   │   └── songs/         # Song CRUD operations
│   ├── shared/            # Shared resources
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # Global React contexts (Theme)
│   │   ├── styles/        # Global styles, theme variables
│   │   ├── test-utils/    # Testing utilities
│   │   ├── types/         # Common TypeScript types
│   │   └── validation/    # Zod schemas, validation hooks
│   └── lib/               # Core utilities
│       ├── database.types.ts  # Supabase type definitions
│       ├── supabase.ts        # Supabase client
│       └── utils.ts           # Utility functions
├── public/                # Static files & PWA assets
├── PRPs/                  # Product requirement documents
│   ├── templates/         # PRP templates
│   ├── ai_docs/          # Claude Code documentation
│   └── *.md              # Feature PRPs
├── claude_md_files/       # Development documentation
├── song-database/         # Song data files
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Dependencies and scripts
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

## Key Utilities and Patterns

### Auto-Save Architecture
Three-tier storage system with compression:

1. **Memory State**: Current editor content
2. **Session Storage**: Tab-specific recovery
3. **IndexedDB**: Persistent storage with LZ-String compression

See `src/features/arrangements/docs/AUTO_SAVE_ARCHITECTURE.md` for details.

## Anti-Patterns to Avoid

- L Don't create minimal context prompts - context is everything - the PRP must be comprehensive and self-contained, reference relevant documentation and examples.
- L Don't skip validation steps - they're critical for one-pass success - The better The AI is at running the validation loop, the more likely it is to succeed.
- L Don't ignore the structured PRP format - it's battle-tested
- L Don't create new patterns when existing templates work
- L Don't hardcode values that should be config
- L Don't catch all exceptions - be specific

## Working with This Framework

### Testing
- we use jest with ts-jest for tests
- **BEFORE** actually running tests:
  - when running all tests: `yarn typecheck`
  - when running a single test file: `yarn typecheck | grep path/to/file`
    - No output means no type errors in that file
    - IF there are type errors THEN
      - **SKIP** running tests and proceed to "Understanding test results"
- makes sure your working directory is the root of the repo
- when running tests, **ALWAYS** run `jest` / `yarn test`
- when executing a single test file, use `jest path/to/file`
- if user is asking about specific tests (keywords: "test", "check")
  - run only those specific tests
  - if there are type errors or test failures proceed to "Understanding test results"

#### Test Engineering Flow
- After each modification of a test, **BEFORE** running the test **ALWAYS** make sure that there are no type or lint errors
- If there are errors corresponding to files **external** from the test, think harder, is the implementation code actually correct? 
- If there are errors related to the test file, proceed to "Understanding test results"
- 
#### Understanding test results
- if there are type errors or test failures:
  - load the relevant test file(s) and corresponding implementations using the Read tool
  - If type errors detected, those are usually symptoms that there's a mismatch between the test and implementation code
    - Follow the Typescript system, Type inference, and type definitions to understand the root cause
  - analyze the code and errors, if TS errors are present, read relevant type definitions
  - Respond with Test Results and quick Root Cause Analysis
  - If the fix is obvious, **ASK** before actually fixing it

#### Working on tests
- Understanding the test code:
  - read the test file and related implementation code
  - understand the purpose of the test and what it's trying to validate
  - check for any setup/teardown logic that might affect test isolation
  - check for any mock data or dependencies used in the tests
  - always assume implementation code is correct and tests are wrong
  - then think harder, is the implementation code actually correct?
- IF modifying or adding tests THEN you **MUST**:
  - ensure tests are isolated and do not depend on each other
  - use existing tests as reference examples
  - use mock data ONLY if there is no existing data available
  - update mock data structures to match current types
  - if you struggle to type mocked data correctly, check if you could use `Partial<T>` or `Omit<T, 'prop'>` utility types
  - **ALWAYS** add JSDoc comments to new or modified tests. Example:
    ```ts
    describe('Basic Entity Operations', () => {
      /**
       * Tests customer creation and retrieval functionality
       * @see {@link file:../src/implementation.ts} for implementation details
       * @see {@link SignalsBusCore.createEntityCollection} for createEntityCollection implementation
       * @see {@link CustomerModel} {@link file:../src/models/Customer.ts:22} for Customer model
       * @see https://github.com/edgora-hq/signals/issues for requirements [if applicable]
       */
       test('should create and retrieve a customer', async () => {
         // Test code...
       });
    });    ```
  - **NEVER** change core implementation to make tests pass without user permission
  - **NEVER** skip or comment out failing tests without user permission
  - **ALWAYS** 

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
