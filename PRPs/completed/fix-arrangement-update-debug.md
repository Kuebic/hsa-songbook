# Debug Summary: Arrangement Update "Not Found" Error

## Issue
When trying to change the name of an arrangement, the update fails with:
```
Failed to save arrangement: Error: Arrangement not found
    updateArrangement useArrangementMutations.ts:202
```

## Root Cause Analysis

### Problem 1: Missing Initial Data
The `useArrangementMutations` hook was being called without the `initialArrangements` prop, causing the optimistic update logic to fail because it couldn't find the arrangement in its empty `optimisticArrangements` array.

### Problem 2: Slug Instability
The slug was being regenerated from the arrangement name, which means:
- Changing the arrangement name would change the slug
- URLs would break when arrangements are renamed
- Database lookups by slug would fail after name changes

## Fixes Applied

### Fix 1: Pass Initial Arrangements to Hook
```typescript
// Before:
const { createArrangement, updateArrangement } = useArrangementMutations()

// After:
const { createArrangement, updateArrangement } = useArrangementMutations({
  initialArrangements: arrangement ? [arrangement] : []
})
```

This ensures the hook has the current arrangement data for optimistic updates.

### Fix 2: Stable Slug Generation
```typescript
// Generate slug with random suffix for new arrangements
const randomSuffix = Math.random().toString(36).substring(2, 7)
const slug = `${baseSlug}-${randomSuffix}`
```

Now:
- New arrangements get a slug with a random suffix (e.g., `my-arrangement-ab3x2`)
- Existing arrangements keep their original slug when renamed
- URLs remain stable even when arrangement names change

## Testing Verification

### Before Fix
1. Edit an arrangement
2. Change the name
3. Save → **Error: Arrangement not found**

### After Fix
1. Edit an arrangement
2. Change the name
3. Save → **Success**
4. URL remains the same
5. Arrangement is accessible at the same URL

## Long-term Recommendation

Consider implementing a more robust slug system:
1. Use UUIDs or database IDs in URLs instead of name-based slugs
2. Store both `slug` (for URLs) and `display_name` (for UI) separately
3. Never change slugs after creation to maintain URL stability

## Prevention

1. **Always pass required props**: Hooks that need initial data should get it
2. **Stable identifiers**: URLs should use stable identifiers that don't change with user-editable fields
3. **Test edge cases**: Always test renaming/editing operations
4. **Type safety**: TypeScript could have caught this if `initialArrangements` was marked as required when needed

## Files Modified

1. `/src/features/songs/components/ArrangementManagementForm.tsx`
   - Fixed `useArrangementMutations` initialization
   - Enhanced slug generation with random suffix
   - Added comments explaining slug stability