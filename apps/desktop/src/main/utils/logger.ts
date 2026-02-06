/**
 * Centralized Logging Utility
 *
 * Provides consistent logging across the application with:
 * - Environment-aware log levels
 * - Structured logging with context
 * - Timestamps for all log entries
 * - Future-ready for log aggregation services
 *
 * Phase 2.0.1 - Code Quality Improvements
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogContext {
  [key: string]: any;
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
        stack: context.stack
      });
    } else if (context) {
      console.error(formatted, context);
    } else {
      console.error(formatted);
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
