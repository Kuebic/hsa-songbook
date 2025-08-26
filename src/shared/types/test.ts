// Test-specific type definitions
import type { Mock } from 'vitest';

// Mock function types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockedFunction<T extends (...args: any[]) => any = (...args: any[]) => any> = Mock<T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMockedFunction = Mock<(...args: any[]) => any>;

// Test context and data types
export type TestContext = Record<string, unknown>;
export type TestData = unknown;
export type TestFixture<T = unknown> = T;

// Test assertion helpers
export type ExpectedType<T> = T;
export type ActualType<T> = T;

// Test scenario types
export interface TestScenario<Input = unknown, Expected = unknown> {
  name: string;
  input: Input;
  expected: Expected;
  skip?: boolean;
  only?: boolean;
}

// Database test types
export interface TestRecord {
  id?: string | number;
  [key: string]: unknown;
}

// API test types  
export interface MockRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface MockResponse {
  status?: number;
  data?: unknown;
  error?: unknown;
  [key: string]: unknown;
}

// Benchmark types for vitest
export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  warmupTime?: number;
  time?: number;
  throws?: boolean;
}