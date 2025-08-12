/**
 * @file types.ts
 * @description Shared types for ChordPro editor components
 */

export interface AutoCompleteItem {
  value: string;
  description?: string;
  insertText: string;
}

export interface AutoCompleteState {
  isVisible: boolean;
  items: AutoCompleteItem[];
  selectedIndex: number;
  triggerChar: '{' | '[' | null;
  triggerPosition: number;
}