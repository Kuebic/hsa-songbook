# Create BASE PRP

## Feature: $ARGUMENTS

Generate a complete PRP for React/TypeScript/Vite feature implementation with deep and thorough research. Ensure rich context is passed to the AI through the PRP to enable one pass implementation success through self-validation and iterative refinement.

The AI agent only gets the context you are appending to the PRP and its own training data. Assume the AI agent has access to the codebase and the same knowledge cutoff as you, so its important that your research findings are included or referenced in the PRP. The Agent has Websearch capabilities, so pass urls to documentation and examples.

## Research Process

> During the research process, create clear tasks and spawn as many agents and subagents as needed using the batch tools. Check PRPs/ai_docs/ if any similar research has been done. The deeper research we do here the better the PRP will be. we optimize for chance of success and not for speed.

1. **Codebase Analysis in depth**
   - Create clear todos and spawn subagents to search the codebase for similar features/patterns Think hard and plan your approach
   - **Vertical Slice Architecture Analysis**: 
     - Identify existing feature slices (src/features/songs/, src/features/auth/, etc.)
     - Analyze how each slice organizes: types, components, hooks, services, pages
     - Map feature boundaries and identify minimal cross-feature dependencies
     - Document the vertical slice pattern to follow for new features
   - Identify all the necessary files to reference in the PRP
   - Note all existing conventions to follow (React 19 patterns, TypeScript strict mode, Vite config)
   - Check existing test patterns for validation approach (Vitest, React Testing Library)
   - Review component structure and hooks patterns within existing vertical slices
   - Use the batch tools to spawn subagents to search the codebase for similar features/patterns

2. **External Research at scale**
   - Create clear todos and spawn with instructions subagents to do deep research for similar features/patterns online and include urls to documentation and examples
   - Library documentation (include specific URLs for React 19, Vite, TypeScript libraries)
   - For critical pieces of documentation add a .md file to PRPs/ai_docs and reference it in the PRP with clear reasoning and instructions
   - Implementation examples (GitHub/StackOverflow/blogs with React/Vite focus)
   - Best practices for React hooks, state management, and performance optimization
   - Vite-specific configuration and optimization patterns
   - Use the batch tools to spawn subagents to search for similar features/patterns online and include urls to documentation and examples

3. **User Clarification**
   - Ask for clarification if you need it

## PRP Generation

Using PRPs/templates/prp_base_typescript.md as template:

### Critical Context at minimum to Include and pass to the AI agent as part of the PRP

- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from codebase
- **Gotchas**: Library quirks, version issues, TypeScript gotchas
- **Patterns**: Existing approaches to follow
- **Best Practices**: Common pitfalls found during research

### Implementation Blueprint

- **Vertical Slice Design**: Plan the complete feature slice from UI to data layer
- Start with pseudocode showing approach following vertical slice principles
- Reference real files for patterns within existing feature slices
- **Feature Boundary Definition**: Clearly define what belongs in this slice vs dependencies on other slices  
- Include error handling strategy within the slice
- List tasks to be completed to fulfill the PRP in the order they should be completed, prioritizing complete vertical slice implementation
- Use the pattern in the PRP with information dense keywords

### Validation Gates (Must be Executable by the AI agent)

```bash
# Type checking
npm run type-check

# Linting and formatting
npm run lint

# Unit Tests with Vitest
npm run test

# Test coverage check
npm run test:coverage

# Build validation with Vite
npm run build

# Preview production build
npm run preview

# Bundle size analysis (if configured)
npm run analyze
```

The more validation gates the better, but make sure they are executable by the AI agent.
Include tests, build validation, linting, and any other relevant validation gates. Get creative with the validation gates.

**_ CRITICAL AFTER YOU ARE DONE RESEARCHING AND EXPLORING THE CODEBASE BEFORE YOU START WRITING THE PRP _**

**_ ULTRATHINK ABOUT THE PRP AND PLAN YOUR APPROACH IN DETAILED TODOS THEN START WRITING THE PRP _**

## Output

Save as: `PRPs/{feature-name}.md`

## Quality Checklist

- [ ] All necessary context included
- [ ] **Vertical slice architecture clearly defined and documented**
- [ ] **Feature boundaries explicitly identified with minimal cross-slice dependencies**
- [ ] Validation gates are executable by AI
- [ ] References existing vertical slice patterns from codebase
- [ ] Clear implementation path following slice-first approach
- [ ] Error handling documented within the feature slice

Score the PRP on a scale of 1-10 (confidence level to succeed in one-pass implementation using claude codes)

Remember: The goal is one-pass implementation success through comprehensive context.
