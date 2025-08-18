# Undo-Redo Command Pattern Implementation Reference

## Critical Implementation Details for HSA Songbook

This document contains essential implementation details for the undo-redo system with command pattern, specifically tailored for the HSA Songbook ChordPro editor.

## Command Pattern Architecture

### Why Command Pattern Over Memento Pattern

The Command pattern is superior for real-world applications because:

1. **Side Effects Management**: Commands can handle API calls, localStorage updates, and DOM manipulations
2. **Granular Updates**: Prevents state collision by updating only what changed
3. **Memory Efficiency**: Stores operations, not full state snapshots
4. **Reversibility**: Each command knows how to undo itself

### Core Command Interface

```typescript
// Base command interface following HSA Songbook patterns
interface EditorCommand {
  id: string;                    // Unique identifier for deduplication
  timestamp: number;              // For history ordering and merging
  type: CommandType;              // Discriminated union type
  
  execute(): Promise<CommandResult>;
  undo(): Promise<CommandResult>;
  
  // Optional for advanced features
  canMerge?(other: EditorCommand): boolean;
  merge?(other: EditorCommand): EditorCommand;
  serialize?(): string;
  deserialize?(data: string): EditorCommand;
}

interface CommandResult {
  success: boolean;
  error?: Error;
  state?: Partial<EditorState>;
}

// Command types enum
enum CommandType {
  INSERT_TEXT = 'INSERT_TEXT',
  DELETE_TEXT = 'DELETE_TEXT',
  REPLACE_TEXT = 'REPLACE_TEXT',
  INSERT_DIRECTIVE = 'INSERT_DIRECTIVE',
  TRANSPOSE = 'TRANSPOSE',
  FORMAT = 'FORMAT'
}
```

### Specific Command Implementations

```typescript
// Text insertion command with merge capability
class InsertTextCommand implements EditorCommand {
  id: string;
  timestamp: number;
  type = CommandType.INSERT_TEXT;
  
  constructor(
    private position: number,
    private text: string,
    private editorRef: React.MutableRefObject<HTMLTextAreaElement>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }
  
  async execute(): Promise<CommandResult> {
    const textarea = this.editorRef.current;
    if (!textarea) return { success: false };
    
    const before = textarea.value.substring(0, this.position);
    const after = textarea.value.substring(this.position);
    textarea.value = before + this.text + after;
    
    // Set cursor position
    textarea.setSelectionRange(
      this.position + this.text.length,
      this.position + this.text.length
    );
    
    return { success: true };
  }
  
  async undo(): Promise<CommandResult> {
    const textarea = this.editorRef.current;
    if (!textarea) return { success: false };
    
    const before = textarea.value.substring(0, this.position);
    const after = textarea.value.substring(this.position + this.text.length);
    textarea.value = before + after;
    
    textarea.setSelectionRange(this.position, this.position);
    
    return { success: true };
  }
  
  canMerge(other: EditorCommand): boolean {
    if (other.type !== CommandType.INSERT_TEXT) return false;
    const otherInsert = other as InsertTextCommand;
    
    // Merge if inserting consecutively within 500ms
    const isConsecutive = otherInsert.position === this.position + this.text.length;
    const isRecent = otherInsert.timestamp - this.timestamp < 500;
    
    return isConsecutive && isRecent && this.text.length === 1 && otherInsert.text.length === 1;
  }
  
  merge(other: EditorCommand): EditorCommand {
    const otherInsert = other as InsertTextCommand;
    this.text += otherInsert.text;
    this.timestamp = otherInsert.timestamp;
    return this;
  }
}
```

## Storage Strategy

### Three-Tier Storage Architecture

```typescript
// 1. Memory (for active session)
interface MemoryStore {
  undoStack: EditorCommand[];
  redoStack: EditorCommand[];
  maxSize: 100;  // Limit for memory management
}

// 2. SessionStorage (for browser session persistence)
interface SessionStore {
  key: `chord-editor-session-${string}`;
  data: {
    content: string;
    compressedHistory?: string;  // LZ-string compressed
    timestamp: number;
    version: 1;
  };
  maxSize: 5 * 1024 * 1024;  // 5MB limit
}

// 3. IndexedDB (for large content and long-term drafts)
interface IndexedDBStore {
  dbName: 'chord-editor-db';
  version: 1;
  stores: {
    drafts: {
      keyPath: 'arrangementId';
      indexes: ['timestamp', 'userId'];
    };
    history: {
      keyPath: 'id';
      indexes: ['arrangementId', 'timestamp'];
    };
  };
}
```

### Storage Service Implementation

```typescript
import LZString from 'lz-string';
import { openDB, DBSchema } from 'idb';

class EditorStorageService {
  private db: IDBDatabase | null = null;
  
  async initializeDB(): Promise<void> {
    this.db = await openDB<EditorDBSchema>('chord-editor-db', 1, {
      upgrade(db) {
        // Drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', {
            keyPath: 'arrangementId'
          });
          draftStore.createIndex('timestamp', 'timestamp');
          draftStore.createIndex('userId', 'userId');
        }
        
        // History store for large command histories
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('arrangementId', 'arrangementId');
          historyStore.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }
  
  // SessionStorage methods
  saveDraftToSession(arrangementId: string, content: string, history: EditorCommand[]): void {
    const key = `chord-editor-session-${arrangementId}`;
    
    try {
      const data = {
        content,
        compressedHistory: history.length > 10 
          ? LZString.compress(JSON.stringify(history))
          : undefined,
        timestamp: Date.now(),
        version: 1
      };
      
      const serialized = JSON.stringify(data);
      
      // Check size before saving
      if (serialized.length > 5 * 1024 * 1024) {
        // Too large for sessionStorage, use IndexedDB
        this.saveLargeDraftToIndexedDB(arrangementId, content, history);
        return;
      }
      
      sessionStorage.setItem(key, serialized);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Clear old drafts and retry
        this.clearOldDrafts();
        sessionStorage.setItem(key, serialized);
      }
    }
  }
  
  async saveLargeDraftToIndexedDB(
    arrangementId: string, 
    content: string, 
    history: EditorCommand[]
  ): Promise<void> {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db!.transaction(['drafts', 'history'], 'readwrite');
    
    // Save draft
    await tx.objectStore('drafts').put({
      arrangementId,
      content,
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    });
    
    // Save compressed history in chunks if needed
    if (history.length > 0) {
      const compressed = LZString.compress(JSON.stringify(history));
      await tx.objectStore('history').put({
        arrangementId,
        data: compressed,
        timestamp: Date.now()
      });
    }
    
    await tx.done;
  }
  
  clearOldDrafts(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Clear old sessionStorage drafts
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('chord-editor-session-')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (data.timestamp < oneWeekAgo) {
            sessionStorage.removeItem(key);
          }
        } catch {}
      }
    }
  }
  
  private getCurrentUserId(): string {
    // Get from auth context or localStorage
    return localStorage.getItem('userId') || 'anonymous';
  }
}
```

## Auto-Save Implementation

### Throttled Auto-Save Pattern

```typescript
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { throttle, debounce } from 'lodash';

function useAutoSave(
  arrangementId: string,
  content: string,
  history: EditorCommand[],
  isDirty: boolean
) {
  const storageService = useRef(new EditorStorageService());
  const saveInProgress = useRef(false);
  
  // Debounced save for typing (wait for pause)
  const debouncedSave = useMemo(
    () => debounce(
      async (content: string, history: EditorCommand[]) => {
        if (saveInProgress.current) return;
        saveInProgress.current = true;
        
        try {
          await storageService.current.saveDraftToSession(
            arrangementId,
            content,
            history
          );
        } finally {
          saveInProgress.current = false;
        }
      },
      2000  // 2 second debounce
    ),
    [arrangementId]
  );
  
  // Throttled save as backup (regular intervals)
  const throttledSave = useMemo(
    () => throttle(
      async (content: string, history: EditorCommand[]) => {
        if (saveInProgress.current) return;
        saveInProgress.current = true;
        
        try {
          await storageService.current.saveDraftToSession(
            arrangementId,
            content,
            history
          );
        } finally {
          saveInProgress.current = false;
        }
      },
      30000,  // Every 30 seconds
      { leading: false, trailing: true }
    ),
    [arrangementId]
  );
  
  // Save on content change
  useEffect(() => {
    if (isDirty) {
      debouncedSave(content, history);
      throttledSave(content, history);
    }
    
    return () => {
      debouncedSave.cancel();
      throttledSave.cancel();
    };
  }, [content, history, isDirty, debouncedSave, throttledSave]);
  
  // Save on unmount/navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !saveInProgress.current) {
        // Synchronous save attempt
        storageService.current.saveDraftToSession(
          arrangementId,
          content,
          history
        );
        
        // Show browser dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Final save on unmount
      if (isDirty) {
        storageService.current.saveDraftToSession(
          arrangementId,
          content,
          history
        );
      }
    };
  }, [arrangementId, content, history, isDirty]);
}
```

## Exit Save Strategy

### MongoDB Save on Exit

```typescript
function useExitSave(
  arrangementId: string,
  content: string,
  isDirty: boolean
) {
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const { addNotification } = useNotification();
  const savePromiseRef = useRef<Promise<void> | null>(null);
  
  const performExitSave = useCallback(async () => {
    if (!isDirty || savePromiseRef.current) return;
    
    savePromiseRef.current = (async () => {
      try {
        const token = await getToken();
        if (!token || !userId) {
          throw new Error('Authentication required');
        }
        
        await arrangementService.updateArrangement(
          arrangementId,
          { chordProText: content },
          token,
          userId
        );
        
        // Clear session draft after successful save
        sessionStorage.removeItem(`chord-editor-session-${arrangementId}`);
        
      } catch (error) {
        // Keep draft in session storage for recovery
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: 'Your changes have been saved locally and will be recovered when you return.'
        });
        throw error;
      } finally {
        savePromiseRef.current = null;
      }
    })();
    
    return savePromiseRef.current;
  }, [arrangementId, content, isDirty, getToken, userId, addNotification]);
  
  // Navigation guard
  useEffect(() => {
    const unblock = navigate((location, action) => {
      if (isDirty && action === 'POP') {
        performExitSave();
        return false;  // Block navigation until save completes
      }
      return true;
    });
    
    return unblock;
  }, [navigate, isDirty, performExitSave]);
  
  // Component unmount save
  useEffect(() => {
    return () => {
      if (isDirty) {
        performExitSave();
      }
    };
  }, [isDirty, performExitSave]);
  
  return { performExitSave };
}
```

## Recovery Implementation

```typescript
function useSessionRecovery(arrangementId: string) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<EditorCommand[]>([]);
  
  useEffect(() => {
    const checkForDraft = async () => {
      // Check sessionStorage
      const sessionKey = `chord-editor-session-${arrangementId}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          setDraftContent(parsed.content);
          
          if (parsed.compressedHistory) {
            const decompressed = LZString.decompress(parsed.compressedHistory);
            setDraftHistory(JSON.parse(decompressed));
          }
          
          setHasDraft(true);
          return;
        } catch {}
      }
      
      // Check IndexedDB for large drafts
      const storageService = new EditorStorageService();
      const draft = await storageService.loadDraftFromIndexedDB(arrangementId);
      
      if (draft) {
        setDraftContent(draft.content);
        setDraftHistory(draft.history || []);
        setHasDraft(true);
      }
    };
    
    checkForDraft();
  }, [arrangementId]);
  
  const recoverDraft = useCallback(() => {
    return {
      content: draftContent,
      history: draftHistory
    };
  }, [draftContent, draftHistory]);
  
  const discardDraft = useCallback(() => {
    sessionStorage.removeItem(`chord-editor-session-${arrangementId}`);
    // Also clear from IndexedDB
    const storageService = new EditorStorageService();
    storageService.deleteDraft(arrangementId);
    
    setHasDraft(false);
    setDraftContent(null);
    setDraftHistory([]);
  }, [arrangementId]);
  
  return {
    hasDraft,
    recoverDraft,
    discardDraft
  };
}
```

## Testing Strategy

### Command Testing

```typescript
describe('InsertTextCommand', () => {
  let textarea: HTMLTextAreaElement;
  let command: InsertTextCommand;
  
  beforeEach(() => {
    textarea = document.createElement('textarea');
    textarea.value = 'Hello World';
    document.body.appendChild(textarea);
    
    const ref = { current: textarea };
    command = new InsertTextCommand(5, ' Test', ref);
  });
  
  afterEach(() => {
    document.body.removeChild(textarea);
  });
  
  it('should insert text at correct position', async () => {
    const result = await command.execute();
    
    expect(result.success).toBe(true);
    expect(textarea.value).toBe('Hello Test World');
    expect(textarea.selectionStart).toBe(10);
  });
  
  it('should undo text insertion', async () => {
    await command.execute();
    const result = await command.undo();
    
    expect(result.success).toBe(true);
    expect(textarea.value).toBe('Hello World');
    expect(textarea.selectionStart).toBe(5);
  });
  
  it('should merge consecutive single character inserts', () => {
    const ref = { current: textarea };
    const command1 = new InsertTextCommand(5, 'a', ref);
    const command2 = new InsertTextCommand(6, 'b', ref);
    
    command2.timestamp = command1.timestamp + 100;  // Within merge window
    
    expect(command1.canMerge(command2)).toBe(true);
    
    const merged = command1.merge(command2);
    expect((merged as InsertTextCommand).text).toBe('ab');
  });
});
```

## Performance Considerations

1. **Memory Management**:
   - Limit undo history to 100 operations
   - Compress history when storing
   - Clear old operations periodically

2. **Storage Optimization**:
   - Use LZ-string for compression (optimized for UTF-16)
   - Implement size checks before storage attempts
   - Use IndexedDB for large content

3. **Throttling Strategy**:
   - Debounce for user typing (2 seconds)
   - Throttle for backup saves (30 seconds)
   - Immediate save on critical events

4. **Error Recovery**:
   - Multiple storage fallbacks
   - Graceful degradation
   - User notifications for failures

## Integration Points

1. **With existing useChordEditor hook**:
   - Extend current undo/redo implementation
   - Maintain backward compatibility
   - Preserve existing keyboard shortcuts

2. **With arrangementService**:
   - Use existing retry logic
   - Follow compression patterns
   - Integrate with optimistic updates

3. **With notification system**:
   - Show save status
   - Display recovery options
   - Alert on errors

4. **With auth system**:
   - Verify user before saves
   - Handle token refresh
   - Support offline mode

This reference provides the complete implementation blueprint for the undo-redo system with command pattern, specifically tailored for the HSA Songbook ChordPro editor.