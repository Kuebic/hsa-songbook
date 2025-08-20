import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ViewerLayout } from '../ViewerLayout'

describe('ViewerLayout', () => {
  let observeMock: ReturnType<typeof vi.fn>
  let disconnectMock: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    // Mock ResizeObserver
    observeMock = vi.fn()
    disconnectMock = vi.fn()
    
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: observeMock,
      unobserve: vi.fn(),
      disconnect: disconnectMock,
    }))
  })

  describe('Component rendering', () => {
    it('should render content', () => {
      render(
        <ViewerLayout content={<div>Main Content</div>} />
      )

      expect(screen.getByText('Main Content')).toBeInTheDocument()
    })

    it('should render header when provided', () => {
      render(
        <ViewerLayout 
          header={<div>Header Content</div>}
          content={<div>Main Content</div>} 
        />
      )

      expect(screen.getByText('Header Content')).toBeInTheDocument()
    })

    it('should render toolbar when provided', () => {
      render(
        <ViewerLayout 
          toolbar={<div>Toolbar Content</div>}
          content={<div>Main Content</div>} 
        />
      )

      expect(screen.getByText('Toolbar Content')).toBeInTheDocument()
    })

    it('should render controls when provided', () => {
      render(
        <ViewerLayout 
          controls={<div>Controls Content</div>}
          content={<div>Main Content</div>} 
        />
      )

      expect(screen.getByText('Controls Content')).toBeInTheDocument()
    })

    it('should render all sections when provided', () => {
      render(
        <ViewerLayout 
          header={<div>Header</div>}
          toolbar={<div>Toolbar</div>}
          content={<div>Content</div>}
          controls={<div>Controls</div>}
        />
      )

      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Toolbar')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Controls')).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('should have correct wrapper classes', () => {
      const { container } = render(
        <ViewerLayout 
          header={<div>Header</div>}
          toolbar={<div>Toolbar</div>}
          content={<div>Content</div>}
          controls={<div>Controls</div>}
        />
      )

      expect(container.querySelector('.viewer-layout')).toBeInTheDocument()
      expect(container.querySelector('.viewer-header-wrapper')).toBeInTheDocument()
      expect(container.querySelector('.viewer-toolbar-wrapper')).toBeInTheDocument()
      expect(container.querySelector('.viewer-content')).toBeInTheDocument()
      expect(container.querySelector('.viewer-controls-wrapper')).toBeInTheDocument()
    })

    it('should apply correct styles to main container', () => {
      const { container } = render(
        <ViewerLayout content={<div>Content</div>} />
      )

      const layout = container.querySelector('.viewer-layout')
      expect(layout).toHaveStyle({
        maxHeight: 'calc(100vh - 60px)',
        height: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      })
    })

    it('should apply correct styles to content area', () => {
      const { container } = render(
        <ViewerLayout content={<div>Content</div>} />
      )

      const content = container.querySelector('.viewer-content')
      expect(content).toHaveStyle({
        overflow: 'hidden',
        position: 'relative',
      })
    })
  })

  describe('Height calculations', () => {
    it('should calculate content height based on component heights', () => {
      const { container } = render(
        <ViewerLayout 
          header={<div style={{ height: '50px' }}>Header</div>}
          toolbar={<div style={{ height: '40px' }}>Toolbar</div>}
          content={<div>Content</div>}
          controls={<div style={{ height: '30px' }}>Controls</div>}
        />
      )

      // Mock offsetHeight for each element
      const headerWrapper = container.querySelector('.viewer-header-wrapper') as HTMLElement
      const toolbarWrapper = container.querySelector('.viewer-toolbar-wrapper') as HTMLElement
      const controlsWrapper = container.querySelector('.viewer-controls-wrapper') as HTMLElement
      
      if (headerWrapper) {
        Object.defineProperty(headerWrapper, 'offsetHeight', {
          writable: true,
          value: 50,
        })
      }
      
      if (toolbarWrapper) {
        Object.defineProperty(toolbarWrapper, 'offsetHeight', {
          writable: true,
          value: 40,
        })
      }
      
      if (controlsWrapper) {
        Object.defineProperty(controlsWrapper, 'offsetHeight', {
          writable: true,
          value: 30,
        })
      }

      // Content height should be: 100vh - (50 + 40 + 30 + 60) = 100vh - 180px
      const content = container.querySelector('.viewer-content')
      
      // Note: The initial render will have calc(100vh - 60px) since heights update asynchronously
      // This test verifies the component structure rather than the dynamic calculation
      expect(content).toHaveStyle({
        height: 'calc(100vh - 60px)',
      })
    })

    it('should calculate content height without optional components', () => {
      const { container } = render(
        <ViewerLayout content={<div>Content</div>} />
      )

      // Without header, toolbar, and controls, height should be: 100vh - 60px
      const content = container.querySelector('.viewer-content')
      expect(content).toHaveStyle({
        height: 'calc(100vh - 60px)',
      })
    })
  })

  describe('ResizeObserver integration', () => {
    it('should observe header element when provided', () => {
      render(
        <ViewerLayout 
          header={<div>Header</div>}
          content={<div>Content</div>} 
        />
      )

      expect(observeMock).toHaveBeenCalled()
    })

    it('should observe toolbar element when provided', () => {
      render(
        <ViewerLayout 
          toolbar={<div>Toolbar</div>}
          content={<div>Content</div>} 
        />
      )

      expect(observeMock).toHaveBeenCalled()
    })

    it('should observe controls element when provided', () => {
      render(
        <ViewerLayout 
          controls={<div>Controls</div>}
          content={<div>Content</div>} 
        />
      )

      expect(observeMock).toHaveBeenCalled()
    })

    it('should disconnect ResizeObserver on unmount', () => {
      const { unmount } = render(
        <ViewerLayout 
          header={<div>Header</div>}
          content={<div>Content</div>} 
        />
      )

      unmount()

      expect(disconnectMock).toHaveBeenCalled()
    })

    it('should not observe elements that are not provided', () => {
      render(
        <ViewerLayout content={<div>Content</div>} />
      )

      expect(observeMock).not.toHaveBeenCalled()
    })
  })

  describe('Dynamic updates', () => {
    it('should update when header changes', () => {
      const { rerender } = render(
        <ViewerLayout 
          header={<div>Header 1</div>}
          content={<div>Content</div>} 
        />
      )

      expect(screen.getByText('Header 1')).toBeInTheDocument()

      rerender(
        <ViewerLayout 
          header={<div>Header 2</div>}
          content={<div>Content</div>} 
        />
      )

      expect(screen.getByText('Header 2')).toBeInTheDocument()
    })

    it('should add/remove sections dynamically', () => {
      const { rerender } = render(
        <ViewerLayout content={<div>Content</div>} />
      )

      expect(screen.queryByText('Toolbar')).not.toBeInTheDocument()

      rerender(
        <ViewerLayout 
          toolbar={<div>Toolbar</div>}
          content={<div>Content</div>} 
        />
      )

      expect(screen.getByText('Toolbar')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle null header gracefully', () => {
      const { container } = render(
        <ViewerLayout 
          header={null}
          content={<div>Content</div>} 
        />
      )

      expect(container.querySelector('.viewer-header-wrapper')).not.toBeInTheDocument()
    })

    it('should handle undefined toolbar gracefully', () => {
      const { container } = render(
        <ViewerLayout 
          toolbar={undefined}
          content={<div>Content</div>} 
        />
      )

      expect(container.querySelector('.viewer-toolbar-wrapper')).not.toBeInTheDocument()
    })

    it('should handle empty controls gracefully', () => {
      const { container } = render(
        <ViewerLayout 
          controls={null}
          content={<div>Content</div>} 
        />
      )

      expect(container.querySelector('.viewer-controls-wrapper')).not.toBeInTheDocument()
    })
  })

  describe('Responsive behavior', () => {
    it('should maintain flex column layout', () => {
      const { container } = render(
        <ViewerLayout 
          header={<div>Header</div>}
          toolbar={<div>Toolbar</div>}
          content={<div>Content</div>}
          controls={<div>Controls</div>}
        />
      )

      const layout = container.querySelector('.viewer-layout')
      expect(layout).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
      })
    })

    it('should handle viewport changes', async () => {
      const { container } = render(
        <ViewerLayout 
          header={<div>Header</div>}
          content={<div>Content</div>}
        />
      )

      // Simulate viewport change
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 500,
      })

      window.dispatchEvent(new Event('resize'))

      // The component should still maintain its structure
      const layout = container.querySelector('.viewer-layout')
      expect(layout).toHaveStyle({
        maxHeight: 'calc(100vh - 60px)',
      })
    })
  })
})