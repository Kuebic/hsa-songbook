/**
 * Custom ACE Editor mode for ChordPro syntax highlighting
 */

export function defineChordProMode(ace: unknown) {
  (ace as { define: (name: string, deps: string[], factory: (require: (module: string) => unknown, exports: Record<string, unknown>) => void) => void }).define('ace/mode/chordpro_highlight_rules', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text_highlight_rules'], 
    function(require: (module: string) => unknown, exports: Record<string, unknown>) {
      const oop = require('ace/lib/oop') as { inherits: (child: unknown, parent: unknown) => void };
      const TextHighlightRules = (require('ace/mode/text_highlight_rules') as { TextHighlightRules: unknown }).TextHighlightRules;

      const ChordProHighlightRules = function(this: Record<string, unknown>) {
        this.$rules = {
          start: [
            // Comments - lines starting with #
            {
              token: 'comment.line.chordpro',
              regex: '^#.*$'
            },
            // Directives with values {key: value}
            {
              token: ['keyword.control.chordpro', 'text', 'string.value.chordpro'],
              regex: '(\\{)([^:}]+:[^}]*)(\\})'
            },
            // Section directives (start/end)
            {
              token: 'keyword.control.section.chordpro',
              regex: '\\{(?:start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob|start_of_tab|end_of_tab)\\}',
              caseInsensitive: true
            },
            // Section markers [Verse], [Chorus], etc.
            {
              token: 'entity.name.section.chordpro',
              regex: '\\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\\s+\\d+)?\\]',
              caseInsensitive: true
            },
            // Chord symbols [C], [Am7], [G/B], etc.
            {
              token: 'markup.bold.chord.chordpro',
              regex: '\\[[A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*(?:\\/[A-G][#b]?)?\\]'
            },
            // Default text (lyrics)
            {
              token: 'text',
              regex: '.+'
            }
          ]
        };
        
        this.normalizeRules();
      };

      oop.inherits(ChordProHighlightRules, TextHighlightRules);
      exports.ChordProHighlightRules = ChordProHighlightRules;
    }
  );

  (ace as { define: (name: string, deps: string[], factory: (require: (module: string) => unknown, exports: Record<string, unknown>) => void) => void }).define('ace/mode/chordpro', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/chordpro_highlight_rules'], 
    function(require: (module: string) => unknown, exports: Record<string, unknown>) {
      const oop = require('ace/lib/oop') as { inherits: (child: unknown, parent: unknown) => void };
      const TextMode = (require('ace/mode/text') as { Mode: unknown }).Mode;
      const ChordProHighlightRules = (require('ace/mode/chordpro_highlight_rules') as { ChordProHighlightRules: unknown }).ChordProHighlightRules;

      const Mode = function(this: Record<string, unknown>) {
        this.HighlightRules = ChordProHighlightRules;
        this.$behaviour = this.$defaultBehaviour;
      };

      oop.inherits(Mode, TextMode);

      (function(this: Record<string, unknown>) {
        this.lineCommentStart = '#';
        this.$id = 'ace/mode/chordpro';
      }).call(Mode.prototype);

      exports.Mode = Mode;
    }
  );
}

/**
 * ACE Editor theme for ChordPro (light and dark mode compatible)
 */
export const chordProTheme = `
  /* ChordPro ACE Editor Theme */
  
  /* Light mode colors */
  .ace-chordpro .ace_keyword.ace_control.ace_chordpro {
    color: #7c3aed;
    font-weight: 600;
  }
  
  .ace-chordpro .ace_keyword.ace_control.ace_section.ace_chordpro {
    color: #7c3aed;
    font-weight: 600;
  }
  
  .ace-chordpro .ace_string.ace_value.ace_chordpro {
    color: #7c3aed;
  }
  
  .ace-chordpro .ace_entity.ace_name.ace_section.ace_chordpro {
    color: #059669;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .ace-chordpro .ace_markup.ace_bold.ace_chord.ace_chordpro {
    color: #2563eb;
    font-weight: bold;
  }
  
  .ace-chordpro .ace_comment.ace_line.ace_chordpro {
    color: #6b7280;
    font-style: italic;
  }
  
  /* Dark mode colors */
  @media (prefers-color-scheme: dark) {
    .ace-chordpro .ace_keyword.ace_control.ace_chordpro {
      color: #a78bfa;
    }
    
    .ace-chordpro .ace_keyword.ace_control.ace_section.ace_chordpro {
      color: #a78bfa;
    }
    
    .ace-chordpro .ace_string.ace_value.ace_chordpro {
      color: #a78bfa;
    }
    
    .ace-chordpro .ace_entity.ace_name.ace_section.ace_chordpro {
      color: #34d399;
    }
    
    .ace-chordpro .ace_markup.ace_bold.ace_chord.ace_chordpro {
      color: #60a5fa;
    }
    
    .ace-chordpro .ace_comment.ace_line.ace_chordpro {
      color: #9ca3af;
    }
  }
  
  /* Editor background */
  .ace-chordpro {
    background-color: transparent;
    color: #1f2937;
  }
  
  @media (prefers-color-scheme: dark) {
    .ace-chordpro {
      color: #f3f4f6;
    }
  }
  
  /* Cursor and selection */
  .ace-chordpro .ace_cursor {
    color: #1f2937;
  }
  
  @media (prefers-color-scheme: dark) {
    .ace-chordpro .ace_cursor {
      color: #f3f4f6;
    }
  }
  
  .ace-chordpro .ace_selection {
    background: rgba(59, 130, 246, 0.3);
  }
  
  /* Gutter */
  .ace-chordpro .ace_gutter {
    background: #f9fafb;
    color: #6b7280;
  }
  
  @media (prefers-color-scheme: dark) {
    .ace-chordpro .ace_gutter {
      background: #1f2937;
      color: #9ca3af;
    }
  }
  
  .ace-chordpro .ace_gutter-active-line {
    background-color: #e5e7eb;
  }
  
  @media (prefers-color-scheme: dark) {
    .ace-chordpro .ace_gutter-active-line {
      background-color: #374151;
    }
  }
`;

/**
 * Helper to configure ACE Editor for ChordPro
 */
export function configureAceForChordPro(ace: unknown, editor: unknown) {
  // Define the custom mode
  defineChordProMode(ace);
  
  // Set editor options for ChordPro
  editor.setOptions({
    mode: 'ace/mode/chordpro',
    theme: 'ace/theme/textmate', // Use a neutral base theme
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace',
    showGutter: false,
    showPrintMargin: false,
    highlightActiveLine: true,
    wrap: true,
    useSoftTabs: true,
    tabSize: 2,
    behavioursEnabled: true,
    wrapBehavioursEnabled: true,
    autoScrollEditorIntoView: true,
    copyWithEmptySelection: true
  });
  
  // Add custom CSS class for styling
  editor.container.classList.add('ace-chordpro');
  
  return editor;
}