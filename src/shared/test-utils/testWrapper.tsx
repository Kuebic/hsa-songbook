import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { ErrorBoundary } from '@features/monitoring'
import { NotificationProvider } from '@shared/components/notifications/NotificationProvider'
import { ModalProvider } from '@shared/components/modal/ModalProvider'
import { PlaybackProvider } from '@features/setlists/contexts/PlaybackContext'

interface TestWrapperProps {
  children: React.ReactNode
  initialEntries?: string[]
  initialIndex?: number
  path?: string
  element?: React.ReactElement
}

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries in tests
      gcTime: 0, // Disable caching
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
})

/**
 * Custom test wrapper that provides all necessary contexts for testing
 * This wrapper includes:
 * - React Query provider
 * - React Router provider
 * - Theme provider
 * - Modal provider
 * - Notification provider
 * - Auth provider (via Clerk mocks in setup)
 * - Error boundary
 */
export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  initialEntries = ['/'],
  initialIndex = 0,
  path,
  element
}) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <ThemeProvider>
          <ModalProvider>
            <NotificationProvider>
              <ErrorBoundary>
              {path && element ? (
                <Routes>
                  <Route path={path} element={element} />
                  <Route path="*" element={<div>{children}</div>} />
                </Routes>
              ) : (
                children
              )}
              </ErrorBoundary>
            </NotificationProvider>
          </ModalProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/**
 * Wrapper for components that need playback context
 */
export const TestWrapperWithPlayback: React.FC<TestWrapperProps> = (props) => {
  return (
    <TestWrapper {...props}>
      <PlaybackProvider>
        {props.children}
      </PlaybackProvider>
    </TestWrapper>
  )
}

/**
 * Minimal wrapper for unit tests that don't need all providers
 */
export const MinimalTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render function that uses TestWrapper by default
 */
import { render as rtlRender, RenderOptions } from '@testing-library/react'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  initialIndex?: number
  path?: string
  element?: React.ReactElement
  useMinimalWrapper?: boolean
  withPlayback?: boolean
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries,
    initialIndex,
    path,
    element,
    useMinimalWrapper = false,
    withPlayback = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (useMinimalWrapper) {
      return <MinimalTestWrapper>{children}</MinimalTestWrapper>
    }
    
    if (withPlayback) {
      return (
        <TestWrapperWithPlayback
          initialEntries={initialEntries}
          initialIndex={initialIndex}
          path={path}
          element={element}
        >
          {children}
        </TestWrapperWithPlayback>
      )
    }
    
    return (
      <TestWrapper
        initialEntries={initialEntries}
        initialIndex={initialIndex}
        path={path}
        element={element}
      >
        {children}
      </TestWrapper>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }