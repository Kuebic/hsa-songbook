/**
 * @file EnhancedEditorExample.tsx
 * @description Example component showcasing all enhanced ChordPro editor features
 */

import React, { useState } from 'react';
import { ChordProEditor } from '../index';

const sampleChordProContent = `{title: Amazing Grace}
{subtitle: Traditional Hymn}
{artist: John Newton}
{key: G}
{tempo: 90}

{start_of_verse}
[G]Amazing [G/B]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G/B]lost, but [C]now I'm [G]found
Was [Em]blind but [D]now I [G]see
{end_of_verse}

{start_of_chorus}
'Twas [G]grace that [G/B]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
How [G]precious [G/B]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_chorus}

{start_of_verse}
Through [G]many [G/B]dangers, [C]toils and [G]snares
I [G]have al[Em]ready [D]come
'Tis [G]grace that [G/B]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home
{end_of_verse}

{comment: This is a comment}
# This is also a comment line`;

export const EnhancedEditorExample: React.FC = () => {
  const [content, setContent] = useState(sampleChordProContent);
  const [theme, setTheme] = useState<'light' | 'dark' | 'stage'>('dark');
  const [enableEnhanced, setEnableEnhanced] = useState(true);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Enhanced ChordPro Editor</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Featuring improved textarea, enhanced preview, validation, and more
        </p>
        
        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Theme:</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="px-3 py-1 border rounded bg-background text-foreground"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="stage">Stage</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">
              <input
                type="checkbox"
                checked={enableEnhanced}
                onChange={(e) => setEnableEnhanced(e.target.checked)}
                className="mr-2"
              />
              Enhanced Features
            </label>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto">
        <ChordProEditor
          initialContent={content}
          onChange={setContent}
          theme={theme}
          height={600}
          enableEnhancedFeatures={enableEnhanced}
          fontSize={16}
          autoFocus={false}
          showPreview={true}
          className="shadow-lg"
        />
      </div>

      {/* Feature List */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Enhanced Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📝 Enhanced Textarea</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Undo/Redo with Ctrl+Z/Ctrl+Y</li>
              <li>• Smart auto-completion for directives and chords</li>
              <li>• Bracket pair completion</li>
              <li>• Comment toggling with Ctrl+/</li>
              <li>• Auto-indentation</li>
              <li>• Configurable tab size</li>
              <li>• Touch device optimizations</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🎵 Enhanced Preview</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Zoom controls (50% - 200%)</li>
              <li>• Transpose controls</li>
              <li>• Font size adjustment</li>
              <li>• Show/hide chords toggle</li>
              <li>• Line spacing control</li>
              <li>• Two-column layout option</li>
              <li>• Print/export functionality</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">✅ Validation & Debugging</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Real-time ChordPro validation</li>
              <li>• Error highlighting and reporting</li>
              <li>• Warning detection</li>
              <li>• Syntax error navigation</li>
              <li>• Directive spell checking</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📊 Metrics & Status</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Cursor position display</li>
              <li>• Character and line count</li>
              <li>• Selection length tracking</li>
              <li>• Modification status</li>
              <li>• Validation status indicator</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 Try These Features:</h3>
          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <p>• Type <code>{`{`}</code> to trigger directive auto-completion</p>
            <p>• Type <code>[</code> to trigger chord auto-completion</p>
            <p>• Use <kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd> for undo/redo</p>
            <p>• Use <kbd>Ctrl+/</kbd> to toggle comments</p>
            <p>• Use the preview controls to adjust zoom, transpose, and layout</p>
            <p>• Try intentionally breaking the syntax to see validation errors</p>
          </div>
        </div>
      </div>
    </div>
  );
};
