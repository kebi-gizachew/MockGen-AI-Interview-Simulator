import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught React ErrorBoundary exception:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-rose-500/30 max-w-lg w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Application Exception Encountered
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                An unexpected component rendering error occurred. Our system isolated the fault to protect your candidate session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset Session & Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
