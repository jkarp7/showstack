/**
 * Sentry Error Tracking — Renderer Process
 *
 * Initializes Sentry in the Electron renderer process for error tracking.
 * Configured via VITE_SENTRY_DSN environment variable.
 */

import * as Sentry from '@sentry/electron/renderer';

let initialized = false;

/**
 * Initialize Sentry in the renderer process.
 * Call this before React renders.
 * No-op if VITE_SENTRY_DSN is not set.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  if (initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `showstack@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
    // Filter sensitive data
    beforeSend(event) {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = '[filtered]';
          }
          return breadcrumb;
        });
      }
      return event;
    },
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });

  initialized = true;
}

/**
 * Capture an error in Sentry with optional context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;

  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return initialized;
}
