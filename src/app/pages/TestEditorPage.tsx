import { ChordProEditor } from '@features/arrangements/components/ChordProEditor'
import { useState } from 'react'

export function TestEditorPage() {
  const [content, setContent] = useState(`{title:Amazing Grace}
{key:G}
{tempo:72}

[Verse 1]
[G]Amazing grace, how [G7]sweet the [C]sound
That [G]saved a wretch like [D]me
I [G]once was lost, but [G7]now am [C]found
Was [G]blind but [D]now I [G]see

# This is a comment
{start_of_chorus}
[Chorus]
[G]Grace, [C]grace, God's [G]grace
[Em]Grace that will [D]pardon and [G]cleanse within
{end_of_chorus}`)

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      <div className="border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h1 className="text-xl font-semibold text-gray-100">Chord Editor Test</h1>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-gray-900">
        <div className="h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <ChordProEditor
            arrangementId="test-editor-page"
            initialContent={content}
            onChange={setContent}
            onSave={(text) => {
              console.log('Saved:', text)
              alert('Saved!')
            }}
            height="100%"
            showPreview={true}
            defaultPreviewVisible={true}
            autoFocus={true}
            enableChordCompletion={true}
          />
        </div>
      </div>
    </div>
  )
}