import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface ConvertAnonymousUserProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ConvertAnonymousUser({ onSuccess, onCancel }: ConvertAnonymousUserProps) {
  const { linkEmailToAnonymousUser, linkOAuthToAnonymousUser, isAnonymous } = useAuth()
  const [conversionMethod, setConversionMethod] = useState<'email' | 'oauth' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Don't render if user is not anonymous
  if (!isAnonymous) {
    return null
  }

  const handleEmailConversion = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await linkEmailToAnonymousUser(email, password || undefined)
      setSuccess('Email linked successfully! Please check your email to verify your account.')
      
      // If password was provided, conversion is complete
      if (password) {
        onSuccess?.()
      }
    } catch (err) {
      console.error('Conversion error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to link email to account'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthConversion = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    try {
      await linkOAuthToAnonymousUser(provider)
      // The user will be redirected to OAuth provider
    } catch (err) {
      console.error('OAuth linking error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to link OAuth account'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const containerStyles: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'var(--color-background)',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginTop: '1rem',
    maxWidth: '400px'
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  }

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1rem'
  }

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.6 : 1,
    transition: 'all 0.2s',
    width: '100%',
    marginBottom: '0.5rem'
  }

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6'
  }

  const oauthButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'var(--color-background)',
    color: 'var(--text-primary)'
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  }

  return (
    <div style={containerStyles}>
      <h3 style={titleStyles}>Upgrade Your Account</h3>
      <p style={descriptionStyles}>
        You're currently using a guest account. Convert to a permanent account to save your data across devices and sessions.
      </p>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '4px',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#dcfce7',
          color: '#16a34a',
          borderRadius: '4px',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {!conversionMethod && (
        <>
          <button
            onClick={() => setConversionMethod('email')}
            style={buttonStyles}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            Convert with Email
          </button>

          <button
            onClick={() => handleOAuthConversion('google')}
            style={oauthButtonStyles}
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthConversion('github')}
            style={oauthButtonStyles}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
            </svg>
            Continue with GitHub
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              style={secondaryButtonStyles}
              disabled={isLoading}
            >
              Not Now
            </button>
          )}
        </>
      )}

      {conversionMethod === 'email' && (
        <form onSubmit={handleEmailConversion}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="convert-email" style={labelStyles}>
              Email Address
            </label>
            <input
              id="convert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              style={inputStyles}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="convert-password" style={labelStyles}>
              Password (Optional)
            </label>
            <input
              id="convert-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              style={inputStyles}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              If you don't set a password now, you'll need to verify your email first
            </p>
          </div>

          {password && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="convert-confirm-password" style={labelStyles}>
                Confirm Password
              </label>
              <input
                id="convert-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required={!!password}
                autoComplete="new-password"
                style={inputStyles}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            style={buttonStyles}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            {isLoading ? 'Converting...' : 'Convert Account'}
          </button>

          <button
            type="button"
            onClick={() => setConversionMethod(null)}
            style={secondaryButtonStyles}
            disabled={isLoading}
          >
            Back
          </button>
        </form>
      )}
    </div>
  )
}