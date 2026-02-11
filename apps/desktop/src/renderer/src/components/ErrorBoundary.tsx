import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetry } from '../services/telemetry';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and reports them to telemetry.
 * Provides a fallback UI when errors occur.
 */
export class ErrorBoundary extends Component<Props, State> {
  static displayName = 'ErrorBoundary';

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to telemetry
    telemetry.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Also log to console for development
    logger.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-8">
          <div className="max-w-2xl">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                  <p className="text-gray-300 mb-4">
                    The application encountered an unexpected error. This has been reported
                    automatically.
                  </p>

                  {this.state.error && (
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                        Error details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-950 p-4 rounded overflow-x-auto">
                        <code>{this.state.error.toString()}</code>
                        {this.state.error.stack && (
                          <>
                            {'\n\n'}
                            <code className="text-gray-500">{this.state.error.stack}</code>
                          </>
                        )}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={this.handleReset}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
                    >
                      Reload App
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-400 text-center">
              If this problem persists, please contact support or report an issue on GitHub.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
