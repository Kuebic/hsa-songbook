import { useContext } from 'react';
import { SongModalContext, type SongModalContextType } from '../contexts/SongModalContext';

export function useSongModal(): SongModalContextType {
  const context = useContext(SongModalContext)
  if (!context) {
    throw new Error('useSongModal must be used within a SongModalProvider')
  }
  return context
}