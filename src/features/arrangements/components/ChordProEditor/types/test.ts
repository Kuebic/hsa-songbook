export interface AutoCompleteContext {
  triggerChar: '{' | '[';
  triggerPosition: number;
  filterText: string;
  isVisible: boolean;
  selectedIndex: number;
}
