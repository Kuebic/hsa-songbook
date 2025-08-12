// Debug file to test export
import { AutoCompleteContext } from './types/textArea.types';

// This should work if the export exists
const testContext: AutoCompleteContext = {
  triggerChar: '{',
  triggerPosition: 0,
  filterText: 'test',
  isVisible: true,
  selectedIndex: 0
};

console.log('AutoCompleteContext export works:', testContext);
export { testContext };
