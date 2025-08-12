// Test imports to verify exports work
import { 
  AutoCompleteContext,
  ValidationResult,
  TextAreaMetrics 
} from './types/textArea.types';

// Test that the types are properly imported
const testContext: AutoCompleteContext = {
  triggerChar: '{',
  triggerPosition: 0,
  filterText: 'test',
  isVisible: true,
  selectedIndex: 0
};

console.log('Export test successful', testContext);
