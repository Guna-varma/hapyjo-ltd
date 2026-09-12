import React from 'react';

interface State {
  error: Error | null;
}

/**
 * Last-resort error boundary for the Field Operations app.
 *
 * Without it, any uncaught render error unmounts the whole React tree and the
 * user is left with a blank white page and no way back except knowing to reload.
 * This shows a plain explanation and a Reload button instead. It deliberately
 * uses no app primitives or contexts so it can render even if those are broken.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[field-ops] Uncaught render error:', error, info.componentStack);
    }
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          color: '#1e293b',
        }}
      >
        <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#475569' }}>
            The screen could not be displayed. Your saved data is safe. Reload the app to continue.
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 10,
              border: 0,
              background: '#2563eb',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
