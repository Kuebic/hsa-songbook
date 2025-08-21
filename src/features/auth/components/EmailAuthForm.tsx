import { useState, useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@shared/components/ui/Button'
import styles from './EmailAuthForm.module.css'

type AuthMode = 'signin' | 'signup' | 'reset'

interface EmailAuthFormProps {
  onSuccess?: () => void
}

export function EmailAuthForm({ onSuccess }: EmailAuthFormProps = {}) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Captcha configuration
  // For development: Either disable captcha in Supabase dashboard OR use test keys
  // Test sitekey: '1x00000000000000000000AA' 
  // Test secret (for Supabase): '1x0000000000000000000000000000000AA'
  // For production: Use real keys from Cloudflare dashboard
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  
  // Optional: Use test key for local development if no env var is set
  const effectiveSiteKey = siteKey || (import.meta.env.DEV ? '1x00000000000000000000AA' : null)
  
  // Log configuration for debugging
  if (import.meta.env.DEV && !siteKey) {
    console.info('Turnstile: Using test sitekey for development. Configure Supabase with test secret key or disable captcha.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (mode === 'signup') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    } else if (mode === 'signin' && !password) {
      setError('Please enter your password')
      return
    }

    // Check for captcha token only if siteKey is configured
    if (effectiveSiteKey && !captchaToken) {
      setError('Please complete the captcha verification')
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password, captchaToken)
        onSuccess?.()
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, captchaToken)
        setSuccess('Please check your email to verify your account')
        setMode('signin')
      } else if (mode === 'reset') {
        await resetPassword(email, captchaToken)
        setSuccess('Password reset email sent. Please check your inbox.')
        setMode('signin')
      }
    } catch (err) {
      console.error('Auth error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication'
      setError(errorMessage)
      
      // Reset the captcha on error since tokens are one-time use
      if (turnstileRef.current) {
        turnstileRef.current.reset()
        setCaptchaToken(undefined)
      }
    } finally {
      setIsLoading(false)
      
      // Reset captcha after successful submission (tokens are one-time use)
      if (turnstileRef.current) {
        turnstileRef.current.reset()
        setCaptchaToken(undefined)
      }
    }
  }

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    // Reset captcha when switching modes
    if (turnstileRef.current) {
      turnstileRef.current.reset()
      setCaptchaToken(undefined)
    }
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

  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '400px'
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
    transition: 'all 0.2s'
  }

  const linkStyles: React.CSSProperties = {
    color: '#3b82f6',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem'
  }

  const modeToggleStyles: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem'
  }

  const modeButtonStyles = (isActive: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    color: isActive ? '#3b82f6' : '#6b7280',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #3b82f6' : 'none'
  })

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {mode !== 'reset' && (
        <div style={modeToggleStyles}>
          <button
            type="button"
            onClick={() => handleModeChange('signin')}
            style={modeButtonStyles(mode === 'signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('signup')}
            style={modeButtonStyles(mode === 'signup')}
          >
            Sign Up
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyles}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
          {mode === 'signin' && 'Sign In to Your Account'}
          {mode === 'signup' && 'Create New Account'}
          {mode === 'reset' && 'Reset Password'}
        </h2>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '0.875rem'
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
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        <div>
            <label htmlFor="email" style={labelStyles}>
              Email
            </label>
            <input
              id="email"
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

        {mode !== 'reset' && (
          <div>
            <label htmlFor="password" style={labelStyles}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" style={labelStyles}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
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

        {/* Turnstile Captcha Widget */}
        {effectiveSiteKey && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            margin: '0.5rem 0'
          }}>
            <Turnstile
              ref={turnstileRef}
              siteKey={effectiveSiteKey}
              onSuccess={(token) => {
                setCaptchaToken(token)
                setError(null) // Clear error when captcha is completed
              }}
              onError={() => {
                setError('Captcha verification failed. Please try again.')
                setCaptchaToken(undefined)
              }}
              onExpire={() => {
                setCaptchaToken(undefined)
                setError('Captcha expired. Please complete the verification again.')
              }}
              options={{
                theme: 'auto',
                size: 'normal'
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (effectiveSiteKey && !captchaToken)}
          style={{
            ...buttonStyles,
            opacity: isLoading || (effectiveSiteKey && !captchaToken) ? 0.6 : 1,
            cursor: isLoading || (effectiveSiteKey && !captchaToken) ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && (!effectiveSiteKey || captchaToken)) {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && (!effectiveSiteKey || captchaToken)) {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              Loading...
            </span>
          ) : (
            <>
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Send Reset Email'}
            </>
          )}
        </button>

        {mode === 'signin' && (
          <div className={styles.authFormActions}>
            <Button 
              variant="link" 
              size="sm"
              type="button"
              onClick={() => handleModeChange('reset')}
              className={styles.forgotPasswordButton}
            >
              Forgot Password?
            </Button>
          </div>
        )}

        {mode === 'reset' && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                handleModeChange('signin')
              }}
              style={linkStyles}
            >
              Back to Sign In
            </button>
          </div>
        )}

      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}