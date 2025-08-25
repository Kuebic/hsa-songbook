# Debug Summary: Public Arrangements Not Visible to Unauthenticated Users

## Issue
Public users (not logged in) could not see approved arrangements, even though some arrangements were marked as approved and public.

## Root Cause
The SQL query filter `.neq('moderation_status', 'rejected')` was incorrectly excluding records where `moderation_status` was NULL. 

In SQL/PostgreSQL:
- `NULL != 'rejected'` evaluates to NULL (not true)
- Records with NULL values are filtered out when using `.neq()`
- This caused all arrangements with NULL moderation_status to be hidden from public view

## Fix
Changed the filtering logic from:
```typescript
// OLD - Incorrectly excludes NULL values
query = query.eq('is_public', true).neq('moderation_status', 'rejected')
```

To:
```typescript
// NEW - Explicitly includes NULL and non-rejected statuses
query = query
  .eq('is_public', true)
  .or('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
```

## Files Modified
1. `/src/features/songs/services/arrangementService.ts`
   - Fixed `getAllArrangements()` method (line ~150-157)
   - Fixed `getArrangementsBySongId()` method (line ~309-316)

2. `/src/features/songs/services/songService.ts`
   - Fixed `getAllSongs()` method (line ~201-207)

## Prevention
1. **Testing**: Add integration tests for public user access scenarios
2. **Code Review**: Be aware of SQL NULL handling in filters
3. **Documentation**: Document that NULL moderation_status means "not yet moderated" and should be treated as viewable for public content
4. **Database Design**: Consider setting a default value for moderation_status (e.g., 'pending') instead of allowing NULL

## Verification Steps
1. ✅ Code compiles without errors (`npm run build`)
2. ✅ Lint passes with only warnings (`npm run lint`)
3. ✅ Development server starts successfully
4. Test with an unauthenticated browser session to verify public arrangements are now visible

## Similar Issues to Check
The same pattern might exist in other services that filter by moderation status. Search for `.neq('moderation_status'` patterns in the codebase and verify they handle NULL correctly.