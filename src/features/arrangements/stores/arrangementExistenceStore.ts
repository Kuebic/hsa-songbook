// Simple in-memory store to track non-existent arrangements
// This prevents repeated API calls for arrangements we know don't exist

const nonExistentArrangements = new Set<string>();

export const arrangementExistenceStore = {
  markAsNonExistent(arrangementId: string) {
    nonExistentArrangements.add(arrangementId);
  },
  
  exists(arrangementId: string): boolean {
    return !nonExistentArrangements.has(arrangementId);
  },
  
  reset(arrangementId?: string) {
    if (arrangementId) {
      nonExistentArrangements.delete(arrangementId);
    } else {
      nonExistentArrangements.clear();
    }
  }
};