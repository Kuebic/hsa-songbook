/**
 * @file useChordProValidation.ts
 * @description Hook for real-time ChordPro content validation
 */

import { useState, useEffect, useMemo } from 'react';
import { validateChordProContent } from '../utils/textAreaUtils';
// Define ValidationResult directly to avoid import issues
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  line?: number;
  column?: number;
}

interface UseChordProValidationProps {
  content: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useChordProValidation({
  content,
  enabled = true,
  debounceMs = 300
}: UseChordProValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  useEffect(() => {
    if (!enabled) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    
    const timer = setTimeout(() => {
      const result = validateChordProContent(content);
      setValidation(result);
      setIsValidating(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsValidating(false);
    };
  }, [content, enabled, debounceMs]);

  // Memoized validation state
  const validationState = useMemo(() => ({
    isValid: validation?.isValid ?? true,
    hasErrors: validation ? validation.errors.length > 0 : false,
    hasWarnings: validation ? validation.warnings.length > 0 : false,
    errorCount: validation?.errors.length ?? 0,
    warningCount: validation?.warnings.length ?? 0,
    isValidating
  }), [validation, isValidating]);

  return {
    validation,
    validationState,
    isValidating
  };
}
