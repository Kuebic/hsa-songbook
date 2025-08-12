// Test file to debug import issues
import { AutoCompleteContext } from './types/textArea.types';

// This should compile without errors if the export exists
const test: AutoCompleteContext = {
  triggerChar: '{',
  triggerPosition: 0,
  filterText: '',
  isVisible: true,
  selectedIndex: 0
};

console.log('Import test successful:', test);
