import { Modal } from '@shared/components/modal/Modal';
import { Button } from '../ui/button';

interface RecoveryDialogProps {
  isOpen: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  draftTimestamp?: number;
  draftPreview?: string | null;
  draftAge?: string | null;
  className?: string;
}

export function RecoveryDialog({ 
  isOpen, 
  onRecover, 
  onDiscard, 
  draftTimestamp,
  draftPreview,
  draftAge,
  className = ''
}: RecoveryDialogProps) {
  // Format timestamp if provided but no age string
  const displayAge = draftAge || (draftTimestamp 
    ? `${Math.round((Date.now() - draftTimestamp) / 60000)} minutes ago`
    : 'recently');
  
  const handleRecover = () => {
    onRecover();
  };
  
  const handleDiscard = () => {
    onDiscard();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDiscard} // Close button acts as discard
      title="Recover Unsaved Changes?"
      size="medium"
      closeOnEsc={false} // Prevent accidental close
      closeOnOverlayClick={false} // Force user to make a choice
      showCloseButton={false} // Force using buttons
      className={className}
      testId="recovery-dialog"
    >
      <div className="space-y-4">
        <div className="text-base text-gray-700 dark:text-gray-300">
          <p>
            We found unsaved changes from <strong>{displayAge}</strong>. 
            Would you like to recover them or start fresh?
          </p>
        </div>
        
        {draftPreview && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Draft preview:
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {draftPreview}
            </div>
          </div>
        )}
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-amber-600 dark:text-amber-400" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Choose carefully:</strong> Discarding will permanently delete your unsaved changes.
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleDiscard}
            className="flex-1"
            data-testid="recovery-dialog-discard"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
            Discard Changes
          </Button>
          
          <Button 
            onClick={handleRecover}
            className="flex-1"
            data-testid="recovery-dialog-recover"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
              />
            </svg>
            Recover Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}