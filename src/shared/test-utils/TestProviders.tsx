import type { ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import type { Theme } from '@shared/contexts/theme-types'

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

export function AllTheProviders({ 
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

// createTestQueryClient function available above