# Test Script for Arrangement Viewer Fixes

## Test 1: Transpose Functionality
1. Open an arrangement in viewer mode
2. Click the transpose "+" button
   - ✅ Expected: The key display should change (e.g., C → C#)
   - ✅ Expected: All chords in the content should transpose up
3. Click the transpose "-" button
   - ✅ Expected: The key display should change back
   - ✅ Expected: All chords should transpose down

## Test 2: Auto-Scroll Functionality
1. Open an arrangement in viewer mode
2. Click the "▶ Scroll" button
   - ✅ Expected: Content should start scrolling automatically
   - ✅ Expected: Scroll should be within the content area only (not the whole page)
3. Adjust the scroll speed slider
   - ✅ Expected: Scrolling speed should change accordingly
4. Click "⏸ Pause"
   - ✅ Expected: Scrolling should stop

## Test 3: Print Font Size
1. Open an arrangement in viewer mode
2. Adjust the font size slider to a large size (e.g., 24px)
3. Click the Print button or press Ctrl+P
   - ✅ Expected: Print preview should show text at the selected font size
   - ✅ Expected: Font size should match what's displayed on screen
4. Change font size to small (e.g., 12px) and print again
   - ✅ Expected: Print preview should show smaller text

## Test 4: Stage Mode
1. Press "F" key or click Stage button
   - ✅ Expected: Enter fullscreen stage mode
   - ✅ Expected: Only chords and lyrics visible
2. In stage mode, test transpose buttons
   - ✅ Expected: Transpose should still work
3. Press ESC or click exit button
   - ✅ Expected: Exit stage mode

## Debug Summary

### Issues Fixed:
1. **Transpose not working**: ChordSheetViewer was using its own transposition state instead of receiving it as a prop
2. **Scroll not working**: Scroll state wasn't being passed from toolbar to ChordSheetViewer
3. **Print font size**: Print styles had hardcoded font size instead of using current user setting

### Root Causes:
- State management was fragmented - hooks were being called in multiple components creating separate instances
- Props weren't being passed down properly through the component tree
- Print styles were static instead of dynamic

### Prevention:
- Always pass shared state as props when multiple components need to interact
- Be careful with hooks that manage state - ensure they're called at the right level
- Make print styles dynamic to respect user preferences