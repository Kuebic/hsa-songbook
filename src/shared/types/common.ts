/**
 * Common type definitions for gradual TypeScript migration
 * These types help eliminate `any` usage across the codebase
 */

// Temporary type for gradual migration from any
export type TODO = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Object types
export type UnknownObject = Record<string, unknown>;
export type UnknownArray = unknown[];
export type EmptyObject = Record<string, never>;

// Function types
export type AnyFunction = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type UnknownFunction = (...args: unknown[]) => unknown;
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;

// Event handler types
export type ChangeHandler<T = unknown> = (value: T) => void;
export type EventHandler<E = React.SyntheticEvent> = (event: E) => void;

// Generic response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | Record<string, unknown>;
  message?: string;
}

// Error types
export interface ErrorWithMessage {
  message: string;
  code?: string;
  stack?: string;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;