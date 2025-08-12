import { ChordProEditor } from '@features/arrangements/components/ChordProEditor'
import { useState } from 'react'

export function TestEditorPage() {
  const [content, setContent] = useState(`{title: Amazing Grace}
{key: G}
{tempo: 72}

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chord Editor Test</h1>
      <ChordProEditor
        initialContent={content}
        onChange={setContent}
        onSave={(text) => {
          console.log('Saved:', text)
          alert('Saved!')
        }}
        height={600}
        theme="dark"
        showPreview={true}
        defaultPreviewVisible={true}
        autoFocus={true}
        enableChordCompletion={true}
      />
    </div>
  )
}
