/**
 * Sentry Error Tracking — Renderer Process
 *
 * Initializes Sentry in the Electron renderer process for error tracking.
 * Configured via VITE_SENTRY_DSN environment variable.
 *
 * Uses async dynamic import() to avoid breaking the app if @sentry/electron
 * fails to load in the renderer context.
 */

interface SentryBreadcrumb {
  data?: Record<string, unknown>;
}

interface SentryException {
  stacktrace?: {
    frames?: Array<{ abs_path?: string }>;
  };
}

interface SentryEvent {
  breadcrumbs?: SentryBreadcrumb[];
  exception?: { values?: SentryException[] };
  contexts?: Record<string, unknown>;
}

interface SentryScope {
  setExtras(extras: Record<string, unknown>): void;
}

interface SentryModule {
  init(options: Record<string, unknown>): void;
  captureException(error: Error): void;
  withScope(callback: (scope: SentryScope) => void): void;
}

let initialized = false;
let sentryModule: SentryModule | null = null;

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
    sentryModule = (await import('@sentry/electron/renderer')) as unknown as SentryModule;

    sentryModule.init({
      dsn,
      environment: import.meta.env.MODE,
      // Renderer uses VITE_APP_VERSION env var (set at build time by Vite).
      // Main process uses app.getVersion() from Electron — both are correct for their contexts.
      release: `showstack@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
      beforeSend(event: SentryEvent) {
        // Filter URL data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
            if (breadcrumb.data?.url) {
              breadcrumb.data.url = '[filtered]';
            }
            return breadcrumb;
          });
        }

        // Filter absolute paths from stack traces
        if (event.exception?.values) {
          for (const ex of event.exception.values) {
            if (ex.stacktrace?.frames) {
              for (const frame of ex.stacktrace.frames) {
                if (frame.abs_path) {
                  frame.abs_path = undefined;
                }
              }
            }
          }
        }

        // Remove OS/device context to avoid leaking system info
        if (event.contexts) {
          delete event.contexts.os;
          delete event.contexts.device;
        }

        return event;
      },
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    });

    initialized = true;
  } catch (error) {
    // Log failure so developers can diagnose, but don't crash the app
    console.error('[Sentry] Failed to initialize:', error instanceof Error ? error.message : error);
  }
}

/**
 * Capture an error in Sentry with optional context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized || !sentryModule) return;

  if (context) {
    sentryModule.withScope((scope) => {
      scope.setExtras(context);
      sentryModule!.captureException(error);
    });
  } else {
    sentryModule.captureException(error);
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return initialized;
}
