// Common type definitions for gradual migration from 'any'
// These provide better type safety than 'any' while allowing flexibility

// Temporary type for gradual migration - use sparingly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TODO = any;

// Object types
export type UnknownObject = Record<string, unknown>;
export type UnknownArray = unknown[];
export type EmptyObject = Record<string, never>;

// Function types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;
export type UnknownFunction = (...args: unknown[]) => unknown;
export type VoidFunction = (...args: unknown[]) => void;
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// JSON types
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Error handling types
export type ErrorWithMessage = {
  message: string;
  [key: string]: unknown;
};

// Type guards
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  
  try {
    return { message: JSON.stringify(maybeError) };
  } catch {
    return { message: String(maybeError) };
  }
}

// Network/API types
export interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
  [key: string]: unknown;
}

// Extended Window types for monitoring
export interface ExtendedWindow extends Window {
  gtag?: UnknownFunction;
  Sentry?: UnknownObject;
  [key: string]: unknown;
}

// Extended Performance types
export interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

// Web Vitals types
export interface WebVitalsAttribution {
  [key: string]: unknown;
}