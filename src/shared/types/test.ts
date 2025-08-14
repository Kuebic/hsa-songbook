/**
 * Type definitions for test files
 * More permissive typing allowed for test contexts
 */

import type { Mock } from 'vitest';

// Mock function types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockedFunction<TArgs extends any[] = any[], TReturn = any> = Mock<(...args: TArgs) => TReturn>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SimpleMock = Mock<(...args: any[]) => any>;

// Test context types
export type TestContext = Record<string, unknown>;
export type TestData = Record<string, unknown>;
export type TestFixture<T = unknown> = T;

// Mock response helpers
export interface MockResponse<T = unknown> {
  data?: T;
  error?: Error | string;
  loading?: boolean;
}

// Test user types (for render helpers)
export interface TestUser {
  id: string;
  email: string;
  role?: 'admin' | 'user';
  [key: string]: unknown;
}

// Test props for components
export type TestProps<T = Record<string, unknown>> = T & {
  testId?: string;
};

// Helper for typing test scenarios
export interface TestScenario<T = unknown> {
  name: string;
  input: T;
  expected: unknown;
  description?: string;
}