import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import type { Theme } from '@shared/contexts/theme-types'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTheme?: Theme
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: ReactNode
  initialTheme?: Theme
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
}

function AllTheProviders({ 
  children, 
  initialTheme = 'dark',
  routerProps = {},
  queryClient = createTestQueryClient()
}: AllTheProvidersProps) {
  // Mock localStorage for theme persistence
  if (initialTheme) {
    localStorage.setItem('app-theme', initialTheme)
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter {...routerProps}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const {
    initialTheme,
    routerProps,
    queryClient,
    ...renderOptions
  } = options || {}

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        initialTheme={initialTheme}
        routerProps={routerProps}
        queryClient={queryClient}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
// eslint-disable-next-line react-refresh/only-export-components
export { customRender as render, createTestQueryClient }