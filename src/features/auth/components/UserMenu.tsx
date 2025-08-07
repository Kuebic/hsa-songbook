import { UserButton } from '@clerk/clerk-react'

export function UserMenu() {
  return (
    <UserButton 
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
  )
}