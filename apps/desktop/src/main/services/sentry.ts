/**
 * Sentry Error Tracking — Main Process
 *
 * Initializes Sentry in the Electron main process for crash reporting
 * and error tracking. Configured via SENTRY_DSN environment variable.
 */

import * as Sentry from '@sentry/electron/main';
import { app } from 'electron';

let initialized = false;

/**
 * Initialize Sentry in the main process.
 * Call this as early as possible in app startup.
 * No-op if SENTRY_DSN is not set.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  if (initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `showstack@${app.getVersion()}`,
    // Filter out sensitive data
    beforeSend(event) {
      // Strip file paths from breadcrumbs to avoid leaking user info
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
    // Only send errors, not transactions in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
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
