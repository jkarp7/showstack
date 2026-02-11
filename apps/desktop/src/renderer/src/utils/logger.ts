/**
 * Renderer Process Logger
 *
 * Provides consistent logging across the renderer process with:
 * - Environment-aware log levels
 * - Structured logging with context
 * - Timestamps for all log entries
 * - Sentry integration for error forwarding
 */

import { captureError, isSentryInitialized } from '../services/sentry';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: unknown;
}

class RendererLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message);
      if (context) {
        console.debug(formatted, context);
      } else {
        console.debug(formatted);
      }
    }
  }

  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.INFO, message);
    if (context) {
      console.log(formatted, context);
    } else {
      console.log(formatted);
    }
  }

  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.WARN, message);
    if (context) {
      console.warn(formatted, context);
    } else {
      console.warn(formatted);
    }
  }

  error(message: string, context?: LogContext | Error): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message);

    if (context instanceof Error) {
      console.error(formatted, {
        name: context.name,
        message: context.message,
        stack: context.stack,
      });
      if (isSentryInitialized()) {
        captureError(context);
      }
    } else if (context) {
      console.error(formatted, context);
      if (isSentryInitialized()) {
        captureError(new Error(message), context as Record<string, unknown>);
      }
    } else {
      console.error(formatted);
      if (isSentryInitialized()) {
        captureError(new Error(message));
      }
    }
  }

  getEnvironment(): string {
    return this.isDevelopment ? 'development' : 'production';
  }
}

// Export singleton instance
export const logger = new RendererLogger();

// Export class for testing
export { RendererLogger };
