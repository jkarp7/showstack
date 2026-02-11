/**
 * Sentry Error Tracking — Main Process
 *
 * Initializes Sentry in the Electron main process for crash reporting
 * and error tracking. Configured via SENTRY_DSN environment variable.
 *
 * Uses lazy loading to avoid crashing the app if @sentry/electron
 * fails to load (e.g., in dev mode without proper native module support).
 */

let initialized = false;
let SentryModule: typeof import('@sentry/electron/main') | null = null;

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

  try {
    SentryModule = require('@sentry/electron/main');
    const { app } = require('electron');

    SentryModule!.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: `showstack@${app.getVersion()}`,
      beforeSend(event: any) {
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
            if (breadcrumb.data?.url) {
              breadcrumb.data.url = '[filtered]';
            }
            return breadcrumb;
          });
        }
        return event;
      },
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    });

    initialized = true;
  } catch {
    // Sentry failed to load — continue without error tracking
  }
}

/**
 * Capture an error in Sentry with optional context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized || !SentryModule) return;

  if (context) {
    SentryModule.withScope((scope) => {
      scope.setExtras(context);
      SentryModule!.captureException(error);
    });
  } else {
    SentryModule.captureException(error);
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return initialized;
}
