// Export placeholder functions for setlists API
export function useSetlists() {
  return {
    setlists: [],
    isLoading: false,
    error: null
  }
}

export function useSetlist(_id: string) {
  return {
    setlist: null,
    isLoading: false,
    error: null
  }
}