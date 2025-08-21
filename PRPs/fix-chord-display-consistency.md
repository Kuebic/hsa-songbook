# PRP: Fix Chord Display Consistency Between Editor Preview and Arrangement Viewer

## Executive Summary

The arrangement viewer page displays incorrect/default chord content instead of showing the same content as the chord-pro-editor live preview. Root cause: field naming inconsistency between `chordData` (service layer) and `chordProText` (UI components).

## Problem Statement

When users view an arrangement, they see default/empty chord sheet content instead of the actual saved ChordPro data that appears correctly in the editor's live preview. This is caused by a systematic field naming mismatch across application layers.

## Context & Architecture Analysis

### Current Field Mapping Issue

The application uses **three different field names** for the same ChordPro content:

1. **Database Layer**: `chord_data` (snake_case)
2. **Service Layer**: `chordData` (camelCase) 
3. **UI Layer**: `chordProText` (descriptive camelCase)

### Critical Files Affected

#### Data Flow Path
1. **Database Schema**: `/home/kenei/code/github/Kuebic/hsa-songbook/src/lib/database.types.ts`
   - Lines 102, 118, 134: `chord_data: string`

2. **Service Mapping**: `/home/kenei/code/github/Kuebic/hsa-songbook/src/features/songs/services/arrangementService.ts`
   - Line 25: Maps `chord_data` → `chordData`
   - Lines 373, 417: Updates use `chordData`

3. **Hook Layer Bug**: `/home/kenei/code/github/Kuebic/hsa-songbook/src/features/arrangements/hooks/useArrangementViewer.ts`
   - Line 68: **CRITICAL BUG** - Tries to access non-existent `chordProText` field
   ```typescript
   // Current (broken):
   chordProText: (data as unknown as Record<string, unknown>).chordProText as string || sampleChordPro
   
   // Should be:
   chordProText: data.chordData || sampleChordPro
   ```

4. **Component Layer**: 
   - `/home/kenei/code/github/Kuebic/hsa-songbook/src/features/arrangements/pages/ArrangementViewerPage.tsx` (Line 168)
   - `/home/kenei/code/github/Kuebic/hsa-songbook/src/features/arrangements/components/ChordSheetViewer.tsx`
   - Both expect `chordProText` prop

### Working Components (Editor Preview)

- `/home/kenei/code/github/Kuebic/hsa-songbook/src/features/arrangements/components/ChordProEditor/PreviewPane.tsx`
  - Receives content directly from editor state
  - Uses `useUnifiedChordRenderer` hook correctly

### Vertical Slice Architecture

This fix spans the **arrangements feature slice** (`src/features/arrangements/`):
```
src/features/arrangements/
├── hooks/
│   └── useArrangementViewer.ts        # Primary fix location
├── pages/
│   ├── ArrangementViewerPage.tsx      # Consumer of fixed data
│   └── ChordEditingPage.tsx          # Reference for correct usage
├── components/
│   ├── ChordSheetViewer.tsx          # May need prop updates
│   └── ChordProEditor/
│       └── PreviewPane.tsx            # Working reference
├── services/
│   └── (uses songs/services)         # Cross-slice dependency
└── types/
    └── arrangement.types.ts          # Type definitions to update
```

## External Documentation & Resources

### ChordPro Standards
- **Official Spec**: https://www.chordpro.org/chordpro/chordpro-introduction/
- **Directives**: https://www.chordpro.org/chordpro/chordpro-directives/
- **Best Practices**: https://www.chordpro.org/chordpro/chordpro-chords/

### ChordSheetJS Library (Used in Project)
- **GitHub**: https://github.com/martijnversluis/ChordSheetJS
- **NPM**: https://www.npmjs.com/package/chordsheetjs
- **Examples**: https://codesandbox.io/examples/package/chordsheetjs

## Implementation Blueprint

### Phase 1: Immediate Fix (Minimal Change)

```typescript
// useArrangementViewer.ts - Line 68
// Fix field access to use correct property name
const arrangementWithDefaults: ArrangementViewerData = {
  ...baseArrangement,
  chordProText: data.chordData || sampleChordPro,  // FIX: Access chordData instead
  // ... rest of properties
};
```

### Phase 2: Type Safety Enhancement

```typescript
// arrangement.types.ts
export interface ArrangementDTO {
  // Server response shape
  id: string;
  chordData: string;  // Server field name
  // ... other fields
}

export interface ArrangementViewModel {
  // UI component shape
  id: string;
  chordProText: string;  // UI field name
  // ... other fields
}

// Mapper function
export const mapDTOToViewModel = (dto: ArrangementDTO): ArrangementViewModel => ({
  ...dto,
  chordProText: dto.chordData,  // Explicit mapping
});
```

### Phase 3: Comprehensive Field Standardization (Optional)

1. **Choose Standard Name**: Recommend `chordProContent` (aligns with ChordPro standards)
2. **Update Service Layer**: Modify `arrangementService.ts` mappings
3. **Update UI Components**: Replace all `chordProText` references
4. **Update Validation Schemas**: Align field names in Zod schemas
5. **Migration Strategy**: Handle existing data compatibility

## Validation Gates

### Level 1: TypeScript & Linting
```bash
# Ensure no type errors
npm run build

# Check linting rules
npm run lint
```

### Level 2: Component Testing
```bash
# Run component tests
npm run test -- --run src/features/arrangements/

# Test specific components
npm run test -- --run ArrangementViewerPage
npm run test -- --run ChordSheetViewer
```

### Level 3: Integration Testing
```bash
# Start dev server
npm run dev

# Manual validation checklist:
# 1. Create new arrangement with ChordPro content
# 2. Save arrangement
# 3. Navigate to arrangement view page
# 4. Verify content matches editor preview exactly
# 5. Test with edge cases: empty content, special characters, long content
```

### Level 4: Cross-Browser Testing
```bash
# Build and preview production
npm run build
npm run preview

# Test in multiple browsers:
# - Chrome/Edge
# - Firefox  
# - Safari (if available)
# - Mobile browsers
```

### Level 5: Data Persistence Verification
```typescript
// Test script to verify data flow
const testChordDataFlow = async () => {
  // 1. Create arrangement with known content
  const testContent = "{title: Test Song}\n[C]Test [G]lyrics";
  
  // 2. Save via service
  const saved = await arrangementService.createArrangement({
    chordData: testContent
  });
  
  // 3. Retrieve and verify
  const retrieved = await arrangementService.getArrangement(saved.id);
  console.assert(retrieved.chordData === testContent, "Data mismatch!");
  
  // 4. Verify UI receives correct field
  // Check that useArrangementViewer returns chordProText correctly
};
```

## Error Handling Strategy

### Graceful Degradation
```typescript
// Enhanced error handling in useArrangementViewer.ts
const chordProText = useMemo(() => {
  try {
    // Primary field
    if (data?.chordData) return data.chordData;
    
    // Fallback to alternative field names (migration support)
    if (data?.chordProText) return data.chordProText;
    if (data?.chord_data) return data.chord_data;
    
    // Log warning for debugging
    console.warn('No chord data found in arrangement:', data);
    
    // Return empty (not sample) for production
    return '';
  } catch (error) {
    console.error('Error accessing chord data:', error);
    return '';
  }
}, [data]);
```

### User Feedback
```typescript
// ChordSheetViewer.tsx enhancement
if (!chordProText?.trim()) {
  return (
    <div className="empty-state">
      <p>No chord sheet available</p>
      <button onClick={() => navigate(`/arrangements/${id}/edit`)}>
        Add Chord Sheet
      </button>
    </div>
  );
}
```

## Testing Checklist

- [ ] Arrangement viewer displays actual saved content
- [ ] Content matches editor preview exactly
- [ ] Empty arrangements show appropriate empty state
- [ ] Type safety maintained throughout data flow
- [ ] No console errors or warnings
- [ ] Performance: rendering is smooth and responsive
- [ ] Accessibility: screen readers announce content correctly
- [ ] Migration: existing arrangements display correctly

## Gotchas & Edge Cases

1. **Type Casting Issue**: Current code uses unsafe type casting that masks the field name mismatch
2. **Sample Data**: Ensure sample/default content is only shown when truly empty
3. **Null vs Undefined**: Handle both cases in field access
4. **Special Characters**: Test with ChordPro special syntax like `{title:}`, `[chord]`, etc.
5. **Large Content**: Test with very long ChordPro documents
6. **Concurrent Edits**: Ensure latest data is always displayed

## Performance Considerations

- Use `React.memo` for ChordSheetViewer to prevent unnecessary re-renders
- Implement `useMemo` for expensive ChordPro parsing operations
- Consider virtual scrolling for very long chord sheets
- Cache parsed ChordPro output in component state

## Security Considerations

- Sanitize HTML output when using `dangerouslySetInnerHTML`
- Validate ChordPro content before parsing to prevent injection
- Ensure user permissions are checked before displaying arrangements

## Implementation Order

1. **Critical Fix First**: Update `useArrangementViewer.ts` line 68
2. **Verify Fix**: Test that viewer shows correct content
3. **Type Safety**: Add proper TypeScript interfaces
4. **Error Handling**: Implement graceful degradation
5. **Testing**: Add unit and integration tests
6. **Documentation**: Update component documentation
7. **Optional**: Full field standardization across codebase

## Success Metrics

- ✅ Arrangement viewer displays saved ChordPro content
- ✅ Zero field mapping errors in console
- ✅ 100% type safety (no `any` or unsafe casts)
- ✅ All existing tests pass
- ✅ New tests cover the fixed data flow
- ✅ User feedback: "What I see in preview is what I get in viewer"

## Confidence Score: 9/10

High confidence due to:
- Clear root cause identified
- Simple one-line fix for immediate resolution
- Comprehensive context provided
- Multiple validation gates defined
- Working reference implementations available
- External documentation included

Minor deduction for:
- Potential need for data migration if comprehensive fix is chosen

## AI Agent Instructions

1. Start with the immediate fix in `useArrangementViewer.ts`
2. Test the fix thoroughly using the validation gates
3. If immediate fix works, consider implementing type safety enhancements
4. Only proceed with comprehensive standardization if explicitly requested
5. Ensure all tests pass before marking complete
6. Document any additional issues discovered during implementation

This PRP provides comprehensive context for one-pass implementation success. The immediate fix is a single line change, but the full context ensures proper understanding of the system architecture and potential follow-up improvements.