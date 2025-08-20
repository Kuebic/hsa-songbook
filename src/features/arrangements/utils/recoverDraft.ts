// Emergency draft recovery utility
// This can help recover lost ChordPro content from browser storage

export async function recoverDraft(arrangementId: string): Promise<string | null> {
  try {
    // Check sessionStorage first
    const sessionKey = `chord-editor-draft-${arrangementId}`;
    const sessionData = sessionStorage.getItem(sessionKey);
    
    if (sessionData) {
      try {
        const draft = JSON.parse(sessionData);
        console.log('Found draft in sessionStorage:', {
          timestamp: new Date(draft.timestamp),
          contentLength: draft.content?.length
        });
        return draft.content;
      } catch {
        // Might be plain text
        return sessionData;
      }
    }
    
    // Check IndexedDB
    if ('indexedDB' in window) {
      const dbName = 'ChordProEditorDB';
      const storeName = 'drafts';
      
      return new Promise((resolve) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(storeName)) {
            resolve(null);
            return;
          }
          
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getRequest = store.get(arrangementId);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result?.content) {
              console.log('Found draft in IndexedDB:', {
                timestamp: new Date(result.timestamp),
                contentLength: result.content?.length
              });
              resolve(result.content);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error recovering draft:', error);
    return null;
  }
}

// Function to list all available drafts
export function listAvailableDrafts(): string[] {
  const drafts: string[] = [];
  
  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('chord-editor-draft-')) {
      const id = key.replace('chord-editor-draft-', '');
      drafts.push(id);
    }
  }
  
  return drafts;
}