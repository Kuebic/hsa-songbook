import React, { useState, useEffect } from 'react';

interface AlignmentDebuggerProps {
  enabled?: boolean;
  showGrid?: boolean;
  showMetrics?: boolean;
  className?: string;
}

/**
 * Development tool for debugging text alignment issues
 * Shows grid overlay and font metrics
 */
export const AlignmentDebugger: React.FC<AlignmentDebuggerProps> = ({
  enabled = true,
  showGrid = true,
  showMetrics = true,
  className = '',
}) => {
  const [metrics, setMetrics] = useState({
    fontSize: 0,
    lineHeight: 0,
    charWidth: 0,
    containerWidth: 0,
    containerHeight: 0,
  });

  useEffect(() => {
    if (!enabled || !showMetrics) return;

    const updateMetrics = () => {
      // Find the textarea element
      const textarea = document.querySelector('.chord-editor-textarea') as HTMLTextAreaElement;
      if (!textarea) return;

      const computedStyle = window.getComputedStyle(textarea);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.5;

      // Measure average character width
      const measureSpan = document.createElement('span');
      measureSpan.style.cssText = `
        font-family: ${computedStyle.fontFamily};
        font-size: ${computedStyle.fontSize};
        position: absolute;
        visibility: hidden;
      `;
      measureSpan.textContent = 'XXXXXXXXXXXXXXXXXXXX'; // 20 characters
      document.body.appendChild(measureSpan);
      
      const charWidth = measureSpan.offsetWidth / 20;
      document.body.removeChild(measureSpan);

      const rect = textarea.getBoundingClientRect();

      setMetrics({
        fontSize,
        lineHeight,
        charWidth,
        containerWidth: rect.width,
        containerHeight: rect.height,
      });
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    
    // Update metrics when fonts load
    if (document.fonts) {
      document.fonts.ready.then(updateMetrics);
    }

    return () => {
      window.removeEventListener('resize', updateMetrics);
    };
  }, [enabled, showMetrics]);

  if (!enabled) return null;

  return (
    <>
      {/* Grid overlay */}
      {showGrid && (
        <div 
          className={`alignment-debugger ${className}`}
          aria-hidden="true"
        />
      )}

      {/* Metrics display */}
      {showMetrics && (
        <div 
          className="alignment-metrics"
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div>Font Size: {metrics.fontSize.toFixed(2)}px</div>
          <div>Line Height: {metrics.lineHeight.toFixed(2)}px</div>
          <div>Char Width: {metrics.charWidth.toFixed(2)}px</div>
          <div>Container: {metrics.containerWidth.toFixed(0)} × {metrics.containerHeight.toFixed(0)}</div>
          <div>Chars/Line: {Math.floor(metrics.containerWidth / metrics.charWidth)}</div>
          <div>Lines: {Math.floor(metrics.containerHeight / metrics.lineHeight)}</div>
        </div>
      )}

      {/* Alignment test pattern */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="alignment-test-controls"
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 10000,
          }}
        >
          <button
            onClick={() => {
              const textarea = document.querySelector('.chord-editor-textarea') as HTMLTextAreaElement;
              if (textarea) {
                // Insert test pattern
                const testPattern = [
                  '// Alignment Test Pattern',
                  'WWWWWWWWWW iiiiiiiiii', // Wide and narrow chars
                  '0123456789 0123456789', // Numbers
                  '[C]This is a [G]chord [Am]test [F]line',
                  '{title: Test Song}',
                  '{artist: Test Artist}',
                  '',
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                  'The quick brown fox jumps over the lazy dog.',
                  '',
                  '┌─────────┬─────────┬─────────┐',
                  '│ Cell 1  │ Cell 2  │ Cell 3  │',
                  '├─────────┼─────────┼─────────┤',
                  '│ Data A  │ Data B  │ Data C  │',
                  '└─────────┴─────────┴─────────┘',
                ].join('\n');
                
                textarea.value = testPattern;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginBottom: '5px',
              width: '100%',
            }}
          >
            Insert Test Pattern
          </button>
          
          <button
            onClick={() => {
              const textarea = document.querySelector('.chord-editor-textarea') as HTMLTextAreaElement;
              if (textarea) {
                textarea.classList.toggle('debug');
              }
            }}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Toggle Debug Mode
          </button>
        </div>
      )}
    </>
  );
};

export default AlignmentDebugger;