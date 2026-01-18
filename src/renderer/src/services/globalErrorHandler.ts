/**
 * Global Error Handler
 *
 * Sets up global error listeners for:
 * - Unhandled JavaScript errors
 * - Unhandled promise rejections
 * - Console errors (optional)
 *
 * All errors are reported to telemetry service.
 */

import { telemetry, EventProperties } from './telemetry';

/**
 * Initialize global error handlers
 */
export function initializeGlobalErrorHandlers(): void {
  // Handle unhandled errors
  window.addEventListener('error', (event: ErrorEvent) => {
    telemetry.trackError(event.error || event.message, {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      message: event.message,
    });

    // Don't prevent default error handling
    return false;
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    telemetry.trackError(error, {
      type: 'unhandled_promise_rejection',
      promise: event.promise,
    });

    // Don't prevent default error handling
    return false;
  });

  // Optionally intercept console.error to track application errors
  // NOTE: This intercepts ALL console.error calls to track errors.
  // Tracking respects user opt-out (checked in telemetry.trackError)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Only track if first argument looks like an error
    // SECURITY: Do not track additional args to prevent leaking passwords/API keys
    // The telemetry.trackError method checks if telemetry is enabled before tracking
    if (args[0] instanceof Error) {
      telemetry.trackError(args[0], {
        type: 'console_error',
      });
    } else if (typeof args[0] === 'string' && args[0].toLowerCase().includes('error')) {
      // Track error-like console messages
      telemetry.trackError(args[0], {
        type: 'console_error_string',
      });
    }

    // Call original console.error
    originalConsoleError.apply(console, args);
  };

  if (import.meta.env.DEV) {
    console.log('[GlobalErrorHandler] Error handlers initialized');
  }
}

/**
 * Manually report an error to telemetry
 *
 * Use this for caught errors that you want to track.
 *
 * @param error Error object or message
 * @param context Additional context
 */
export function reportError(
  error: Error | string,
  context: EventProperties = {}
): void {
  telemetry.trackError(error, {
    type: 'manual_report',
    ...context,
  });
}
