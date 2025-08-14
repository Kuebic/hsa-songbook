import { useRef } from 'react'
import type { RefObject } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'

export function usePrint() {
  const printRef = useRef<HTMLDivElement>(null)
  const { fontSize } = useChordSheetSettings()
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm 15mm;
      }
      @media print {
        /* Hide UI elements during print */
        .viewer-header-wrapper,
        .viewer-toolbar-wrapper,
        .viewer-controls-wrapper,
        .viewer-header,
        .viewer-toolbar,
        .viewer-controls,
        .toolbar-button,
        .control-group,
        .no-print {
          display: none !important;
        }
        
        /* Optimize content for printing */
        .chord-sheet-content {
          font-size: ${fontSize}px !important;
          line-height: 1.6 !important;
          color: black !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Style chord cells for better readability */
        .chord-cell {
          font-weight: bold;
          page-break-inside: avoid;
        }
        
        /* Ensure proper text color */
        .lyrics, .lyric-cell {
          color: black !important;
        }
        
        /* Section headers */
        .section-label, .verse-label {
          font-weight: bold;
          margin-top: 0.5em;
          page-break-after: avoid;
        }
        
        /* Avoid page breaks in the middle of verses */
        .verse, .chorus, .bridge {
          page-break-inside: avoid;
        }
        
        /* Remove any animations or transitions */
        * {
          transition: none !important;
          animation: none !important;
        }
      }
    `,
    documentTitle: 'Chord Sheet'
  })
  
  return { 
    handlePrint, 
    printRef 
  }
}

// Hook for custom print content reference
export function usePrintWithRef(contentRef: RefObject<HTMLElement>) {
  const { fontSize } = useChordSheetSettings()
  
  const handlePrint = useReactToPrint({
    contentRef: contentRef as RefObject<HTMLDivElement>,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm 15mm;
      }
      @media print {
        /* Hide UI elements during print */
        .viewer-header-wrapper,
        .viewer-toolbar-wrapper,
        .viewer-controls-wrapper,
        .viewer-header,
        .viewer-toolbar,
        .viewer-controls,
        .toolbar-button,
        .control-group,
        .no-print {
          display: none !important;
        }
        
        /* Optimize content for printing */
        .chord-sheet-content {
          font-size: ${fontSize}px !important;
          line-height: 1.6 !important;
          color: black !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Style chord cells for better readability */
        .chord-cell {
          font-weight: bold;
          page-break-inside: avoid;
        }
        
        /* Ensure proper text color */
        .lyrics, .lyric-cell {
          color: black !important;
        }
        
        /* Section headers */
        .section-label, .verse-label {
          font-weight: bold;
          margin-top: 0.5em;
          page-break-after: avoid;
        }
        
        /* Avoid page breaks in the middle of verses */
        .verse, .chorus, .bridge {
          page-break-inside: avoid;
        }
        
        /* Remove any animations or transitions */
        * {
          transition: none !important;
          animation: none !important;
        }
      }
    `,
    documentTitle: 'Chord Sheet'
  })
  
  return { handlePrint }
}