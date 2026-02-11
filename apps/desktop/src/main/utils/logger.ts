/**
 * Centralized Logging Utility
 *
 * Provides consistent logging across the application with:
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

type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogValue[]
  | { [key: string]: LogValue };

interface LogContext {
  [key: string]: LogValue;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Log debug information (development only)
   * Use for detailed debugging information
   */
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

  /**
   * Log informational messages
   * Use for general application flow
   */
  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.INFO, message);
    if (context) {
      console.log(formatted, context);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log warning messages
   * Use for unexpected but recoverable situations
   */
  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.WARN, message);
    if (context) {
      console.warn(formatted, context);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Log error messages
   * Use for errors and exceptions
   */
  error(message: string, context?: LogContext | Error): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message);

    // Handle Error objects specially
    if (context instanceof Error) {
      console.error(formatted, {
        name: context.name,
        message: context.message,
        stack: context.stack,
      });
      // Forward to Sentry
      if (isSentryInitialized()) {
        captureError(context);
      }
    } else if (context) {
      console.error(formatted, context);
      // Forward to Sentry with context
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

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.isDevelopment ? 'development' : 'production';
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
