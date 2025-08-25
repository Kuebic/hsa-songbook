/**
 * Type conversion utilities for handling null/undefined inconsistencies
 */

/**
 * Convert null values to undefined
 * Useful when database returns null but TypeScript expects undefined
 */
export const nullToUndefined = <T>(value: T | null): T | undefined => 
  value === null ? undefined : value;

/**
 * Convert undefined values to null
 * Useful when TypeScript has undefined but database expects null
 */
export const undefinedToNull = <T>(value: T | undefined): T | null => 
  value === undefined ? null : value;

/**
 * Convert all null properties in an object to undefined
 * Useful for converting database responses to TypeScript types
 */
export const nullsToUndefined = <T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: T[K] extends null ? undefined : T[K] } => {
  const result = {} as Record<string, unknown>;
  for (const key in obj) {
    result[key] = obj[key] === null ? undefined : obj[key];
  }
  return result as { [K in keyof T]: T[K] extends null ? undefined : T[K] };
};

/**
 * Safely access a value that might be null or undefined
 * Returns a default value if the input is null or undefined
 */
export const safeGet = <T>(
  value: T | null | undefined,
  defaultValue: T
): T => {
  return value ?? defaultValue;
};

/**
 * Type guard to check if a value is not null or undefined
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Convert empty string to undefined
 * Useful for form inputs where empty string should be treated as undefined
 */
export const emptyToUndefined = (value: string): string | undefined => {
  return value.trim() === '' ? undefined : value;
};

/**
 * Ensure a value is a string or undefined (not null)
 * Useful for props that expect string | undefined
 */
export const ensureStringOrUndefined = (
  value: string | null | undefined
): string | undefined => {
  return nullToUndefined(value);
};