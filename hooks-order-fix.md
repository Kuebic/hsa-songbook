# React Hooks Order Fix

## Problem
Error: "React has detected a change in the order of Hooks called by ArrangementViewerPage"
- Hooks were being conditionally called based on loading/error states
- The `useEffect` for keyboard shortcuts was placed after conditional returns

## Root Cause
The `useEffect` hook was positioned after the loading/error/not-found conditional returns, which meant:
- During loading: 33 hooks were called
- After loading: 34 hooks were called (the extra useEffect)
This violates React's Rules of Hooks.

## Solution
Moved the `useEffect` hook to line 34-46, before any conditional returns:
```typescript
// ALL hooks must be called before any conditional returns
const { currentKey, transpose, transposition } = useTransposition(arrangement?.key)

// Keyboard shortcuts - moved here, before conditionals
useEffect(() => {
  const handleKeyboardPrint = (e: KeyboardEvent) => {
    // ... print handler
  }
  window.addEventListener('keydown', handleKeyboardPrint)
  return () => window.removeEventListener('keydown', handleKeyboardPrint)
}, [handlePrint])

// NOW we can have conditional returns
if (loading) return <div>Loading...</div>
if (error) return <div>Error...</div>
if (!arrangement) return <div>Not found...</div>
```

## Key Learning
React's Rules of Hooks require that:
1. Hooks must be called in the exact same order on every render
2. Never call hooks inside conditions, loops, or nested functions
3. Always call all hooks before any early returns in a component

## Result
✅ Fixed: Hooks are now called in consistent order regardless of component state
✅ Fixed: No more React hooks violation errors
✅ Maintained: All functionality (print shortcuts, transpose, scroll) still works