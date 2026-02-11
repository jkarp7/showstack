/**
 * Sentry Error Tracking — Renderer Process
 *
 * Initializes Sentry in the Electron renderer process for error tracking.
 * Configured via VITE_SENTRY_DSN environment variable.
 *
 * Uses try/catch to avoid breaking the app if @sentry/electron
 * fails to load in the renderer context.
 */

let initialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null;

/**
 * Initialize Sentry in the renderer process.
 * Call this before React renders.
 * No-op if VITE_SENTRY_DSN is not set.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  if (initialized) {
    return;
  }

  try {
    SentryModule = await import('@sentry/electron/renderer');

    SentryModule.init({
      dsn,
      environment: import.meta.env.MODE,
      release: `showstack@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
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
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
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
    SentryModule.withScope((scope: any) => {
      scope.setExtras(context);
      SentryModule.captureException(error);
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
