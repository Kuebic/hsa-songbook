import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChordProEditor } from '../components/ChordProEditor'
import { useNotification } from '@shared/components/notifications'
import { ErrorBoundary } from '@features/monitoring/components/ErrorBoundary'
import { arrangementService } from '@features/songs/services/arrangementService'
import { useAuth } from '@features/auth'

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
        const arrangement = await arrangementService.getArrangementBySlug(arrangementSlug)
        if (arrangement && arrangement.chordProText) {
          setInitialChordData(arrangement.chordProText)
          setArrangementId(arrangement.id)
        }
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
          chordProText
        }, token, userId)
        
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Arrangement updated successfully'
        })
        navigate(`/arrangements/${slug}`)
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
        arrangementId={arrangementId || 'new-arrangement'} // Use actual ID or fallback for new arrangements
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