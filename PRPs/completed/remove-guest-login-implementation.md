# Remove Guest Login & Improve Forgot Password Button - Implementation PRP

## Context Loading
- [Product Requirements Document](./remove-guest-login-prd.md)
- [Authentication Integration Guide](./ai_docs/anonymous-auth-setup.md)
- [HSA Songbook Architecture](../CLAUDE.md)

## Objective
Remove all guest/anonymous authentication functionality from the HSA Songbook application and improve the "Forgot Password" button styling to maintain consistency across all three themes (light, dark, stage).

## Success Criteria
✅ All anonymous authentication code removed  
✅ Forgot password button styled consistently across themes  
✅ All tests updated and passing  
✅ No regression in existing authentication flows  
✅ Bundle size reduced by ~5-10KB  
✅ Code coverage maintained above 80%  

## Implementation Tasks

### Phase 1: Authentication Component Updates

#### Task 1.1: Update EmailAuthForm Component
**File:** `/src/features/auth/components/EmailAuthForm.tsx`

```typescript
// CHANGES TO MAKE:

1. Update AuthMode type (line 5):
   FROM: type AuthMode = 'signin' | 'signup' | 'reset' | 'anonymous'
   TO:   type AuthMode = 'signin' | 'signup' | 'reset'

2. Remove anonymous handling from useAuth destructuring (line 12):
   FROM: const { signInWithEmail, signUpWithEmail, resetPassword, signInAnonymously } = useAuth()
   TO:   const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth()

3. Remove anonymous validation check (lines 43-44):
   DELETE: // Validation for non-anonymous modes
   DELETE: if (mode !== 'anonymous') {
   CHANGE: Remove the conditional wrapper, keep validation logic

4. Remove anonymous mode handling (lines 85-88):
   DELETE: } else if (mode === 'anonymous') {
   DELETE:   await signInAnonymously(captchaToken)
   DELETE:   onSuccess?.()
   DELETE: }

5. Remove anonymous UI elements (lines 213, 240-251):
   DELETE: {mode === 'anonymous' && 'Continue as Guest'}
   DELETE: Entire anonymous info block

6. Update forgot password button (lines 400-418):
   REPLACE existing button with:
```

```typescript
import { Button } from '@shared/components/ui/Button'

// In the component:
{mode === 'signin' && (
  <div className="auth-form-actions">
    <Button 
      variant="link" 
      size="sm"
      type="button"
      onClick={() => handleModeChange('reset')}
      className="forgot-password-button"
    >
      Forgot Password?
    </Button>
  </div>
)}
```

#### Task 1.2: Update useAuth Hook
**File:** `/src/features/auth/hooks/useAuth.ts`

```typescript
// CHANGES TO MAKE:

1. Remove isAnonymous computation (lines 182-183):
   DELETE: // Check if user is anonymous
   DELETE: const isAnonymous = authState.user?.is_anonymous === true

2. Remove signInAnonymously function (lines 251-264):
   DELETE: entire signInAnonymously function

3. Remove linkEmailToAnonymousUser function (lines 265-278):
   DELETE: entire linkEmailToAnonymousUser function

4. Remove linkOAuthToAnonymousUser function (lines 280-293):
   DELETE: entire linkOAuthToAnonymousUser function

5. Update return statement (lines 314-331):
   REMOVE: isAnonymous, signInAnonymously, linkEmailToAnonymousUser, linkOAuthToAnonymousUser

6. Update getUserName logic (line 322):
   FROM: (isAnonymous ? 'Guest User' : 'User')
   TO:   'User'
```

#### Task 1.3: Update UserMenu Component
**File:** `/src/features/auth/components/UserMenu.tsx`

```typescript
// CHANGES TO MAKE:

1. Remove ConvertAnonymousUser import (line 7):
   DELETE: import { ConvertAnonymousUser } from './ConvertAnonymousUser'

2. Update useAuth destructuring (line 6):
   FROM: const { user, getUserName, getUserAvatar, signOut, isAnonymous } = useAuth()
   TO:   const { user, getUserName, getUserAvatar, signOut } = useAuth()

3. Remove anonymous user display logic (line 144):
   FROM: {isAnonymous ? '👤 Guest User' : user.email}
   TO:   {user.email}

4. Remove upgrade account section (lines 149-152):
   DELETE: entire isAnonymous conditional block
```

### Phase 2: File Deletions & Type Updates

#### Task 2.1: Delete ConvertAnonymousUser Component
```bash
rm /src/features/auth/components/ConvertAnonymousUser.tsx
```

#### Task 2.2: Update Auth Types
**File:** `/src/features/auth/types/index.ts`

```typescript
// CHANGES TO MAKE:
1. Remove is_anonymous extension from User type
   DELETE: is_anonymous?: boolean
```

#### Task 2.3: Update Auth Index Exports
**File:** `/src/features/auth/index.ts`

```typescript
// CHANGES TO MAKE:
1. Remove ConvertAnonymousUser export
   DELETE: export { ConvertAnonymousUser } from './components/ConvertAnonymousUser'
```

### Phase 3: Styling Implementation

#### Task 3.1: Create Button Styles
**File:** `/src/features/auth/components/EmailAuthForm.module.css` (CREATE NEW)

```css
.forgot-password-button {
  /* Base styles */
  color: var(--primary, #3b82f6);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.forgot-password-button:hover {
  opacity: 0.8;
  text-decoration-thickness: 2px;
}

.forgot-password-button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Dark theme overrides */
[data-theme="dark"] .forgot-password-button {
  color: var(--primary, #60a5fa);
}

[data-theme="dark"] .forgot-password-button:hover {
  color: var(--primary-hover, #93bbfc);
}

/* Stage theme overrides */
[data-theme="stage"] .forgot-password-button {
  color: var(--stage-accent, #fbbf24);
  text-shadow: 0 0 2px rgba(251, 191, 36, 0.3);
}

[data-theme="stage"] .forgot-password-button:hover {
  text-shadow: 0 0 4px rgba(251, 191, 36, 0.5);
  color: var(--stage-accent-hover, #fcd34d);
}

/* Form actions container */
.auth-form-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}
```

#### Task 3.2: Import and Apply Styles
**Update:** `/src/features/auth/components/EmailAuthForm.tsx`

```typescript
// Add import at top
import styles from './EmailAuthForm.module.css'

// Use className instead of inline styles
<Button 
  variant="link" 
  size="sm"
  type="button"
  onClick={() => handleModeChange('reset')}
  className={styles.forgotPasswordButton}
>
  Forgot Password?
</Button>
```

### Phase 4: Test Updates

#### Task 4.1: Update Authentication Tests
**File:** `/src/app/__tests__/authentication-protection.test.tsx`

```typescript
// Remove all tests related to anonymous authentication
// Update existing tests to not expect guest option
```

#### Task 4.2: Update Component Tests
**Files to update:**
- `/src/features/songs/components/__tests__/ArrangementManagementForm.test.tsx`
- `/src/features/songs/hooks/__tests__/useArrangementMutations.test.ts`
- `/src/features/songs/components/arrangements/__tests__/ArrangementList.test.tsx`

```typescript
// Remove any mock data or test cases involving is_anonymous
// Update mock auth contexts to not include anonymous properties
```

#### Task 4.3: Create New Tests for Forgot Password Button
**File:** `/src/features/auth/components/__tests__/EmailAuthForm.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { EmailAuthForm } from '../EmailAuthForm'

describe('EmailAuthForm - Forgot Password Button', () => {
  it('should render forgot password button in signin mode', () => {
    render(
      <ThemeProvider>
        <EmailAuthForm />
      </ThemeProvider>
    )
    
    const forgotButton = screen.getByText('Forgot Password?')
    expect(forgotButton).toBeInTheDocument()
    expect(forgotButton).toHaveClass('forgot-password-button')
  })

  it('should switch to reset mode when clicked', () => {
    render(
      <ThemeProvider>
        <EmailAuthForm />
      </ThemeProvider>
    )
    
    const forgotButton = screen.getByText('Forgot Password?')
    fireEvent.click(forgotButton)
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
  })

  it('should not show guest login option', () => {
    render(
      <ThemeProvider>
        <EmailAuthForm />
      </ThemeProvider>
    )
    
    expect(screen.queryByText('Continue as Guest')).not.toBeInTheDocument()
  })

  describe('Theme Support', () => {
    ['light', 'dark', 'stage'].forEach(theme => {
      it(`should apply correct styles in ${theme} theme`, () => {
        document.documentElement.setAttribute('data-theme', theme)
        
        render(
          <ThemeProvider>
            <EmailAuthForm />
          </ThemeProvider>
        )
        
        const forgotButton = screen.getByText('Forgot Password?')
        expect(forgotButton).toHaveClass('forgot-password-button')
        // Additional style assertions can be added
      })
    })
  })
})
```

### Phase 5: Documentation Updates

#### Task 5.1: Mark Anonymous Auth Docs as Deprecated
**File:** `/PRPs/ai_docs/anonymous-auth-setup.md`

Add header:
```markdown
# DEPRECATED - Anonymous Authentication Setup

> ⚠️ **This feature has been removed as of January 2025**  
> This documentation is kept for historical reference only.
```

#### Task 5.2: Update PRPs Mentioning Anonymous Users
Search and update files:
- `/PRPs/add-song-button-popup.md`
- `/PRPs/song-management-form-prd.md`
- `/claude_md_files/auth-integration-lessons.md`

Remove references to anonymous/guest users.

## Validation Gates

### Gate 1: Syntax & Type Checking ✅
```bash
npm run lint && npm run build
```
**Expected:** No errors, all files compile

### Gate 2: Test Suite ✅
```bash
npm run test
```
**Expected:** All tests pass, coverage > 80%

### Gate 3: Development Server ✅
```bash
npm run dev
```
**Manual Testing Checklist:**
- [ ] Sign in with email works
- [ ] Sign up flow works
- [ ] Password reset flow works
- [ ] No "Continue as Guest" option visible
- [ ] Forgot password button visible and styled
- [ ] Theme switching maintains button styles

### Gate 4: Theme Validation ✅
```bash
# Start dev server and test each theme
npm run dev
```
**Test each theme:**
1. Light theme: Forgot password button blue, underlined
2. Dark theme: Forgot password button lighter blue, underlined
3. Stage theme: Forgot password button golden with glow effect

### Gate 5: Production Build ✅
```bash
npm run build && npm run preview
```
**Expected:** 
- Build succeeds
- Bundle size reduced by 5-10KB
- Preview shows no authentication issues

## Rollback Procedure

### Immediate Rollback (< 1 hour)
```bash
# Revert the commit
git revert HEAD
git push origin main

# Redeploy previous version
npm run build
npm run deploy
```

### Feature Flag Rollback (if implemented)
```javascript
// In .env
VITE_ENABLE_GUEST_LOGIN=true

// Redeploy with flag enabled
npm run build
npm run deploy
```

### Database Rollback
If anonymous users were deleted:
```sql
-- Restore from backup
-- Contact database admin for backup restoration
```

## Implementation Checklist

### Pre-Implementation
- [ ] Create feature branch: `git checkout -b remove-guest-login`
- [ ] Backup current auth components
- [ ] Review all affected files

### Phase 1: Core Changes
- [ ] Update EmailAuthForm.tsx
- [ ] Update useAuth.ts
- [ ] Update UserMenu.tsx
- [ ] Delete ConvertAnonymousUser.tsx
- [ ] Update auth types
- [ ] Update auth exports

### Phase 2: Styling
- [ ] Create EmailAuthForm.module.css
- [ ] Apply button styles
- [ ] Test in all three themes

### Phase 3: Testing
- [ ] Update existing tests
- [ ] Add new button tests
- [ ] Run full test suite
- [ ] Manual testing checklist

### Phase 4: Documentation
- [ ] Mark anonymous docs as deprecated
- [ ] Update related PRPs
- [ ] Update README if needed

### Phase 5: Validation
- [ ] Pass all validation gates
- [ ] Code review
- [ ] Merge to main

### Post-Implementation
- [ ] Monitor error logs
- [ ] Check authentication metrics
- [ ] Gather user feedback

## Error Handling

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Import errors after deletion | Update all import statements |
| Type errors in tests | Update mock data to remove is_anonymous |
| Button not styled | Ensure CSS module is imported |
| Theme styles not applying | Check data-theme attribute |
| Tests failing | Remove anonymous-related assertions |

## Performance Metrics

### Before Implementation
- Bundle size: [Measure current]
- Auth component size: [Measure current]
- Test coverage: [Current %]

### After Implementation
- Bundle size: Should be 5-10KB smaller
- Auth component size: ~500 lines removed
- Test coverage: Maintain > 80%

## Notes for AI Implementation

1. **Order Matters**: Complete Phase 1 before Phase 2 to avoid import errors
2. **Test Frequently**: Run tests after each major change
3. **Use Version Control**: Commit after each successful phase
4. **Theme Testing**: Manually verify all three themes
5. **Accessibility**: Ensure keyboard navigation still works

## Completion Criteria

The implementation is complete when:
- [ ] All anonymous auth code removed
- [ ] Forgot password button styled across all themes
- [ ] All tests pass
- [ ] Manual testing checklist complete
- [ ] Documentation updated
- [ ] Code review approved
- [ ] Deployed to production

---

*Implementation PRP Version: 1.0*  
*Based on PRD Version: 1.0*  
*Created: January 21, 2025*  
*Status: Ready for Execution*