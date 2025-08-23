import { Printer, Maximize, Flag } from 'lucide-react'
import { TransposeControls } from './TransposeControls'
import { FontPreferences } from './FontPreferences'
import { ReportButton } from '@features/moderation/components/ReportButton'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useNotification } from '@shared/components/notifications'
// AddToSetlistDropdown removed - setlists under construction
import type { EnhancedTranspositionState } from '../hooks/useTransposition'

interface ViewerToolbarProps {
  onPrint: () => void
  arrangementId?: string
  // Enhanced transposition props
  transposition?: EnhancedTranspositionState & {
    transpose: (steps: number) => void
    reset: () => void
  }
}

export function ViewerToolbar({ 
  onPrint,
  arrangementId,
  transposition
}: ViewerToolbarProps) {
  const { isSignedIn } = useAuth()
  const { addNotification } = useNotification()
  
  return (
    <div className="viewer-toolbar">
      <div className="toolbar-group">
        {/* Print Button */}
        <button
          onClick={onPrint}
          className="toolbar-button"
          title="Print chord sheet (Ctrl+P)"
          aria-label="Print"
        >
          <Printer className="icon" />
          <span className="label">Print</span>
        </button>
        
        {/* Fullscreen Button */}
        <button
          onClick={async () => {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen()
            } else {
              await document.exitFullscreen()
            }
          }}
          className="toolbar-button"
          title="Toggle fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize className="icon" />
          <span className="label">Fullscreen</span>
        </button>
        
        {/* Report Button */}
        {isSignedIn && arrangementId && (
          <ReportButton
            contentId={arrangementId}
            contentType="arrangement"
            buttonText={
              <>
                <Flag className="icon" />
                <span className="label">Report</span>
              </>
            }
            className="toolbar-button"
            onReportSubmitted={() => {
              addNotification({
                type: 'success',
                title: 'Report submitted',
                message: 'Thank you for helping maintain quality content'
              })
            }}
          />
        )}
        
        {/* Setlist feature coming soon */}
      </div>
      
      {/* Existing controls integration */}
      <div className="toolbar-group toolbar-controls">
        {/* Transpose Controls */}
        {transposition && (
          <TransposeControls
            currentKey={transposition.currentKey}
            originalKey={transposition.originalKey}
            semitones={transposition.semitones}
            onTranspose={transposition.transpose}
            onReset={transposition.reset}
            canTransposeUp={transposition.canTransposeUp}
            canTransposeDown={transposition.canTransposeDown}
            variant="toolbar"
          />
        )}
        
        {/* Font Preferences - Compact Version */}
        <FontPreferences showCompact={true} />
      </div>
    </div>
  )
}