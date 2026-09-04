import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

interface ErrorBoundaryProps {
  name?: string;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.name || 'Component'}] caught error:`, error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, copied: false });
    this.props.onReset?.();
  };

  private handleCopyError = (): void => {
    if (!this.state.error) return;
    const details = `Component: ${this.props.name || 'Unknown'}\nError: ${this.state.error.message}\nStack:\n${this.state.error.stack || 'No stack'}`;
    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const componentName = this.props.name || 'Component';

      return (
        <div 
          style={{
            padding: '24px',
            margin: '12px 0',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                {componentName} Encountered an Error
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                The rest of your workspace is safe. You can retry loading this section.
              </div>
            </div>
          </div>

          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#ef4444',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          >
            {this.state.error.message || 'Unknown error occurred.'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-new-note"
              onClick={this.handleReset}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <RotateCcw size={13} />
              <span style={{ marginLeft: '4px' }}>Try Again</span>
            </button>

            <button
              type="button"
              className="editor-icon-btn"
              onClick={this.handleCopyError}
              style={{ fontSize: '12px' }}
            >
              {this.state.copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span style={{ marginLeft: '4px' }}>
                {this.state.copied ? 'Copied' : 'Copy Details'}
              </span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
