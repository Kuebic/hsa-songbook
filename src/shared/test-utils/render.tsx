import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { MemoryRouterProps } from 'react-router-dom'
import type { QueryClient } from '@tanstack/react-query'
import type { Theme } from '@shared/contexts/theme-types'
import { AllTheProviders } from './TestProviders'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTheme?: Theme
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
}

// Component and utility moved to TestProviders.tsx

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
 
export { customRender as render }