import { lazy } from 'react'

// Lazy load Clerk components to reduce main bundle size
export const LazySignInButton = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.SignInButton }))
)

export const LazySignUpButton = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.SignUpButton }))
)

export const LazyUserButton = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.UserButton }))
)

export const LazySignedIn = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.SignedIn }))
)

export const LazySignedOut = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.SignedOut }))
)

// Loading component for better UX during component loading
export function ClerkComponentLoader() {
  return (
    <div 
      style={{ 
        display: 'inline-block',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #3b82f6',
        animation: 'spin 1s linear infinite'
      }}
    />
  )
}

// Add CSS animation styles (in a real app, this would be in a CSS file)
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)