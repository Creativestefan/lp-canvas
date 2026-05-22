import { Component, useEffect } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import Canvas from './canvas'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Canvas component:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(8px)',
          color: '#f87171',
          maxWidth: '500px',
          width: '90%',
          zIndex: 9999,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>⚠️ Render Error</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#fca5a5' }}>
            {this.state.error?.message || 'An error occurred while rendering the canvas.'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle dark mode when 'd' or 'D' is pressed (unless the user is typing in an input/textarea)
      if (
        e.key.toLowerCase() === 'd' &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement) &&
        !document.activeElement?.hasAttribute('contenteditable')
      ) {
        document.documentElement.classList.toggle('dark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Canvas />
    </ErrorBoundary>
  )
}

export default App

