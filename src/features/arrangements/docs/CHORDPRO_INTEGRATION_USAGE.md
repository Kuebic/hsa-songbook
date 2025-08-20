# ChordPro Editor Integration Utilities - Usage Guide

This document provides examples of how to use the new ChordPro editor integration utilities for seamless workflow between arrangement creation/editing and the ChordPro editor.

## Overview

The integration consists of four main utility modules:

1. **Template Generator** - Creates ChordPro templates from song/arrangement metadata
2. **Session Storage Integration** - Handles temporary storage for editor pickup
3. **Navigation Utils** - Manages navigation between views with context preservation
4. **Workflow Service** - Comprehensive service combining all utilities

## Basic Usage Examples

### 1. Creating a New Arrangement with ChordPro Editor

```typescript
import { useChordProWorkflow } from '@/features/arrangements';

function ArrangementCreationForm({ song }: { song: Song }) {
  const { createArrangement } = useChordProWorkflow();
  
  const handleCreateArrangement = async (arrangementData: Partial<Arrangement>) => {
    // This will generate a template, store it in session storage,
    // and navigate to the ChordPro editor with prefill
    const result = await createArrangement(song, arrangementData, {
      includeFullStructure: true,
      navigationOptions: { replace: false }
    });
    
    if (!result.success) {
      console.error('Failed to navigate to editor:', result.error);
    }
  };
  
  return (
    <button onClick={() => handleCreateArrangement({
      name: 'Lead Sheet',
      key: 'G',
      difficulty: 'intermediate',
      tempo: 120
    })}>
      Create Lead Sheet Arrangement
    </button>
  );
}
```

### 2. Editing Existing Arrangement

```typescript
import { useChordProWorkflow } from '@/features/arrangements';

function ArrangementEditButton({ song, arrangement }: { song: Song; arrangement: Arrangement }) {
  const { editArrangement } = useChordProWorkflow();
  
  const handleEdit = async () => {
    const result = await editArrangement(
      song, 
      arrangement, 
      arrangement.chordData, // existing ChordPro content
      { navigationOptions: { openInNewTab: false } }
    );
    
    if (!result.success) {
      alert('Failed to open editor: ' + result.error);
    }
  };
  
  return (
    <button onClick={handleEdit}>
      Edit in ChordPro Editor
    </button>
  );
}
```

### 3. ChordPro Editor Initialization with Template

```typescript
import { useEffect, useState } from 'react';
import { useChordProWorkflow } from '@/features/arrangements';

function ChordProEditor({ arrangementId }: { arrangementId?: string }) {
  const { initializeEditor } = useChordProWorkflow();
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  
  useEffect(() => {
    const { template, shouldPrefill, metadata, clearSession } = initializeEditor(arrangementId);
    
    if (shouldPrefill && template) {
      setContent(template.content);
      setMetadata(metadata);
      
      // Clear the session data after using it
      clearSession();
    }
  }, [arrangementId]);
  
  return (
    <div>
      {metadata && (
        <div className="editor-context">
          <h2>Editing: {metadata.songTitle}</h2>
          {metadata.arrangementName && <p>Arrangement: {metadata.arrangementName}</p>}
        </div>
      )}
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your ChordPro content here..."
      />
    </div>
  );
}
```

### 4. Safe Navigation with Unsaved Changes

```typescript
import { useChordProWorkflow } from '@/features/arrangements';

function EditorWithExitConfirmation({ song, arrangement }: { song: Song; arrangement: Arrangement }) {
  const { handleExit, service } = useChordProWorkflow();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const handleBackToArrangement = () => {
    const result = handleExit(
      () => service.returnToView('arrangement', arrangement.id),
      hasUnsavedChanges,
      'You have unsaved chord sheet changes. Are you sure you want to leave?'
    );
    
    if (result === null) {
      console.log('User cancelled navigation');
    }
  };
  
  return (
    <div>
      <button onClick={handleBackToArrangement}>
        Back to Arrangement
      </button>
      {/* Editor content */}
    </div>
  );
}
```

## Individual Utility Usage

### Template Generation Only

```typescript
import { 
  generateFullChordProTemplate,
  generateMinimalChordProTemplate,
  updateChordProWithArrangementMetadata 
} from '@/features/arrangements';

// Generate a full template with structure and examples
const fullTemplate = generateFullChordProTemplate(song, arrangement);
console.log(fullTemplate.content);

// Generate minimal template with just metadata
const minimalTemplate = generateMinimalChordProTemplate(song, arrangement);

// Update existing content with new arrangement metadata
const updatedContent = updateChordProWithArrangementMetadata(
  existingChordProContent,
  song,
  arrangement
);
```

### Session Storage Management

```typescript
import { 
  storeTemplateForArrangementCreation,
  getChordProTemplate,
  shouldPrefillEditor,
  clearChordProTemplate 
} from '@/features/arrangements';

// Store template for creation workflow
storeTemplateForArrangementCreation(song, arrangement, true);

// Check if we should prefill
if (shouldPrefillEditor(arrangementId)) {
  const templateData = getChordProTemplate(arrangementId);
  if (templateData) {
    console.log('Template content:', templateData.template.content);
    console.log('Source:', templateData.source);
  }
}

// Clean up when done
clearChordProTemplate(arrangementId);
```

### Navigation Utilities

```typescript
import { 
  navigateToCreateArrangement,
  navigateToEditArrangement,
  isInChordProEditor,
  getArrangementIdFromUrl 
} from '@/features/arrangements';

// Navigate to create new arrangement
const result = navigateToCreateArrangement(song, {
  name: 'Guitar Tab',
  key: 'Em',
  difficulty: 'advanced'
}, { openInNewTab: true });

// Check current context
if (isInChordProEditor()) {
  const currentArrangementId = getArrangementIdFromUrl();
  console.log('Currently editing arrangement:', currentArrangementId);
}
```

## Integration with React Router

```typescript
import { useNavigate, useParams } from 'react-router-dom';
import { useChordProWorkflow } from '@/features/arrangements';

function ArrangementPage() {
  const { arrangementId } = useParams();
  const navigate = useNavigate();
  const { service } = useChordProWorkflow();
  
  // Override navigation to use React Router
  const openEditor = (song: Song, arrangement: Arrangement) => {
    // Store template
    service.storeTemplateForEditing(song, arrangement, arrangement.chordData);
    
    // Navigate using React Router
    navigate(`/arrangements/edit/${arrangement.id}?prefill=true`);
  };
  
  return (
    <div>
      <button onClick={() => openEditor(song, arrangement)}>
        Edit Arrangement
      </button>
    </div>
  );
}
```

## Error Handling

```typescript
import { safeNavigate } from '@/features/arrangements';

// Wrap navigation with error handling
await safeNavigate(
  () => navigateToChordProEditor(song, arrangement),
  (error) => {
    console.error('Navigation failed:', error);
    // Show user-friendly error message
    alert('Unable to open the chord editor. Please try again.');
  },
  (url) => {
    console.log('Successfully navigated to:', url);
  }
);
```

## Best Practices

1. **Always clear session data** after consuming it to prevent stale state
2. **Check for prefill flags** before auto-filling editor content
3. **Handle navigation errors** gracefully with user feedback
4. **Use the workflow service** for complex operations rather than individual utilities
5. **Confirm unsaved changes** before navigation to prevent data loss
6. **Store templates immediately** before navigation to ensure data persistence

## Session Data Lifecycle

1. **Store Phase**: Template and metadata stored in sessionStorage when user initiates editor navigation
2. **Transfer Phase**: Navigation occurs with prefill flag in URL
3. **Pickup Phase**: Editor checks for prefill flag and loads template from sessionStorage
4. **Cleanup Phase**: Session data cleared after successful pickup or timeout (30 minutes)

This ensures a smooth handoff between different parts of the application while maintaining data integrity and user context.