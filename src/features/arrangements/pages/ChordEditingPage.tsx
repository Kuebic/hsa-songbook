import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChordProEditor } from '../components/ChordProEditor'
import { useNotification } from '@shared/components/notifications'
import { ErrorBoundary } from '@features/monitoring/components/ErrorBoundary'
import { arrangementService } from '@features/songs/services/arrangementService'
import { useAuth } from '@features/auth'
import { recoverDraft } from '../utils/recoverDraft'

export function ChordEditingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addNotification } = useNotification()
  const { userId, getToken, isSignedIn } = useAuth()

  const [initialChordData, setInitialChordData] = useState<string>('')
  const [loading, setLoading] = useState(!!slug)
  const [arrangementId, setArrangementId] = useState<string | null>(null)

  useEffect(() => {
    const loadArrangement = async (arrangementSlug: string) => {
      try {
        // Always try to load the arrangement from the database first
        const arrangement = await arrangementService.getArrangementBySlug(arrangementSlug)
        
        if (arrangement) {
          // Arrangement exists in database
          setArrangementId(arrangement.id)
          
          // Check for initial ChordPro content from arrangement creation
          const initialContentKey = `initial-chordpro-${arrangementSlug}`
          const storedInitialContent = sessionStorage.getItem(initialContentKey)
          
          if (storedInitialContent && !arrangement.chordData) {
            // Use the generated initial content for new arrangements
            setInitialChordData(storedInitialContent)
            // Clean up the stored content
            sessionStorage.removeItem(initialContentKey)
          } else if (arrangement.chordData) {
            // Use existing ChordPro content
            setInitialChordData(arrangement.chordData)
          } else {
            // Try to recover from draft if no chordData exists
            const recoveredContent = await recoverDraft(arrangement.id)
            if (recoveredContent) {
              console.log('Recovered draft content for arrangement:', arrangement.id)
              setInitialChordData(recoveredContent)
              addNotification({
                type: 'info',
                title: 'Draft Recovered',
                message: 'We recovered your unsaved changes from local storage'
              })
            }
          }
        } else {
          // Arrangement doesn't exist in database
          // Check if we have stored initial content
          const initialContentKey = `initial-chordpro-${arrangementSlug}`
          const storedInitialContent = sessionStorage.getItem(initialContentKey)
          
          if (storedInitialContent) {
            setInitialChordData(storedInitialContent)
            // Clean up the stored content
            sessionStorage.removeItem(initialContentKey)
          } else {
            // Try to recover any draft with a matching pattern
            const possibleIds = [`new-${arrangementSlug}`, arrangementSlug, 'new-unsaved']
            for (const id of possibleIds) {
              const recoveredContent = await recoverDraft(id)
              if (recoveredContent) {
                console.log('Recovered draft content for:', id)
                setInitialChordData(recoveredContent)
                addNotification({
                  type: 'info',
                  title: 'Draft Recovered',
                  message: 'We recovered your unsaved changes from local storage'
                })
                break
              }
            }
          }
          
          // Don't set an arrangementId since it doesn't exist yet
          // The arrangement needs to be created first
          setArrangementId(null)
        }
        
        // Clean up any stale arrangement ID from sessionStorage
        const idKey = `arrangement-id-${arrangementSlug}`
        sessionStorage.removeItem(idKey)
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to load arrangement:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load arrangement'
        })
        navigate('/arrangements')
      }
    }

    if (slug) {
      // Load existing arrangement
      loadArrangement(slug)
    } else {
      setLoading(false)
    }
  }, [slug, addNotification, navigate])

  const handleSave = async (chordProText: string) => {
    try {
      if (!isSignedIn || !userId) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please sign in to save arrangements'
        })
        return
      }

      if (arrangementId && slug) {
        // Update existing arrangement
        const token = await getToken()
        if (!token) {
          throw new Error('Failed to get authentication token')
        }
        
        await arrangementService.updateArrangement(arrangementId, {
          chordData: chordProText
        })
        
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Arrangement saved successfully'
        })
        // Don't navigate away - let user continue editing
      } else {
        // For new arrangements, we'd need to collect metadata first
        // This could redirect to the full arrangement form
        addNotification({
          type: 'info',
          title: 'Information',
          message: 'Please use the arrangement form to create new arrangements with metadata'
        })
        navigate('/songs')
      }
    } catch (error) {
      console.error('Failed to save arrangement:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save arrangement'
      })
    }
  }

  const handleCancel = () => {
    if (slug) {
      navigate(`/arrangements/${slug}`)
    } else {
      navigate(-1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading arrangement...
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ChordProEditor
        arrangementId={arrangementId || `new-${slug || 'unsaved'}`} // Use actual ID or unique fallback for new arrangements
        initialContent={initialChordData}
        onChange={() => {}} // onChange is handled internally
        onSave={handleSave}
        onCancel={handleCancel}
        height="calc(100vh - 4rem)"
        showPreview={true}
        defaultPreviewVisible={true}
        className="m-4"
        autoFocus={true}
        enableChordCompletion={true}
      />
    </ErrorBoundary>
  )
}