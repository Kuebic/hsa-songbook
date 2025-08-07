import { Suspense } from 'react'
import { LazyUserButton, ClerkComponentLoader } from './LazyClerkComponents'

export function UserMenu() {
  return (
    <Suspense fallback={<ClerkComponentLoader />}>
      <LazyUserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: {
              width: '2rem',
              height: '2rem'
            }
          }
        }}
      />
    </Suspense>
  )
}