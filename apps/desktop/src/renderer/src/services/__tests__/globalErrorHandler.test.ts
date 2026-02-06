import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { telemetry } from '../telemetry';
import { initializeGlobalErrorHandlers, reportError } from '../globalErrorHandler';

/**
 * Global Error Handler Tests
 *
 * Target: 70%+ coverage
 * Tests window error listeners and console.error interception
 */

// Mock telemetry
vi.mock('../telemetry', () => ({
  telemetry: {
    trackError: vi.fn(),
  },
}));

describe('GlobalErrorHandler', () => {
  let originalConsoleError: typeof console.error;
  let originalErrorHandler: OnErrorEventHandler;
  let originalRejectionHandler: ((event: PromiseRejectionEvent) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original handlers
    originalConsoleError = console.error;
    originalErrorHandler = window.onerror;
    originalRejectionHandler = window.onunhandledrejection;

    // Reset window handlers
    window.onerror = null;
    window.onunhandledrejection = null;
  });

  afterEach(() => {
    // Restore original handlers
    console.error = originalConsoleError;
    window.onerror = originalErrorHandler;
    window.onunhandledrejection = originalRejectionHandler;
  });

  describe('initializeGlobalErrorHandlers', () => {
    it('should initialize without errors', () => {
      expect(() => initializeGlobalErrorHandlers()).not.toThrow();
    });

    it('should intercept console.error', () => {
      const original = console.error;
      initializeGlobalErrorHandlers();

      expect(console.error).not.toBe(original);
    });
  });

  describe('window.onerror handling', () => {
    beforeEach(() => {
      initializeGlobalErrorHandlers();
    });

    it('should track errors with Error objects', () => {
      const error = new Error('Test error');
      const event = new ErrorEvent('error', {
        error,
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });

      window.dispatchEvent(event);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'unhandled_error',
          filename: 'test.js',
          lineno: 10,
          colno: 5,
        }),
      );
    });

    it('should track errors with message strings', () => {
      const event = new ErrorEvent('error', {
        message: 'String error message',
        filename: 'app.js',
        lineno: 20,
      });

      window.dispatchEvent(event);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        'String error message',
        expect.objectContaining({
          type: 'unhandled_error',
          filename: 'app.js',
          lineno: 20,
        }),
      );
    });
  });

  describe('unhandledrejection handling', () => {
    beforeEach(() => {
      initializeGlobalErrorHandlers();
    });

    it('should track promise rejections with Error objects', () => {
      const error = new Error('Promise rejection');
      // Create a custom event since PromiseRejectionEvent may not be available in test environment
      const promise = Promise.reject(error).catch(() => {}); // Catch to prevent unhandled rejection
      const event = new Event('unhandledrejection') as any;
      event.reason = error;
      event.promise = promise;

      window.dispatchEvent(event);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'unhandled_promise_rejection',
        }),
      );
    });

    it('should track promise rejections with string reasons', () => {
      const reason = 'Promise failed';
      const promise = Promise.reject(reason).catch(() => {}); // Catch to prevent unhandled rejection
      const event = new Event('unhandledrejection') as any;
      event.reason = reason;
      event.promise = promise;

      window.dispatchEvent(event);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          type: 'unhandled_promise_rejection',
        }),
      );

      // Check that error message contains the reason
      const calls = vi.mocked(telemetry.trackError).mock.calls;
      const errorArg = calls[0][0];
      if (typeof errorArg !== 'string') {
        expect(errorArg.message).toContain('Promise failed');
      }
    });

    it('should track promise rejections with non-Error objects', () => {
      const reason = { code: 500, message: 'Server error' };
      const promise = Promise.reject(reason).catch(() => {}); // Catch to prevent unhandled rejection
      const event = new Event('unhandledrejection') as any;
      event.reason = reason;
      event.promise = promise;

      window.dispatchEvent(event);

      expect(telemetry.trackError).toHaveBeenCalled();
    });
  });

  describe('console.error interception', () => {
    beforeEach(() => {
      initializeGlobalErrorHandlers();
    });

    it('should track Error objects logged to console', () => {
      const error = new Error('Console error');

      console.error(error);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'console_error',
        }),
      );
    });

    it('should track error-like strings', () => {
      console.error('Error: Something went wrong');

      expect(telemetry.trackError).toHaveBeenCalledWith(
        'Error: Something went wrong',
        expect.objectContaining({
          type: 'console_error_string',
        }),
      );
    });

    it('should not track additional arguments (security)', () => {
      const error = new Error('Test');
      const sensitiveData = { password: 'secret123', apiKey: 'key123' };

      console.error(error, sensitiveData);

      // Should track error but NOT additional args
      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'console_error',
        }),
      );

      // Ensure sensitiveData is NOT in the tracking call
      const calls = vi.mocked(telemetry.trackError).mock.calls;
      const contextArg = calls[0][1];
      expect(JSON.stringify(contextArg)).not.toContain('password');
      expect(JSON.stringify(contextArg)).not.toContain('apiKey');
    });

    it('should still call original console.error', () => {
      const spy = vi.spyOn(console, 'error');

      console.error('Test message');

      expect(spy).toHaveBeenCalledWith('Test message');
    });

    it('should not track non-error messages', () => {
      console.error('Just a regular log message');

      expect(telemetry.trackError).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive error detection', () => {
      console.error('ERROR: Something broke');
      expect(telemetry.trackError).toHaveBeenCalled();

      vi.clearAllMocks();

      console.error('An error occurred');
      expect(telemetry.trackError).toHaveBeenCalled();
    });
  });

  describe('reportError', () => {
    it('should manually report Error objects', () => {
      const error = new Error('Manual error');
      reportError(error, { source: 'manual' });

      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'manual_report',
          source: 'manual',
        }),
      );
    });

    it('should manually report error strings', () => {
      reportError('String error', { context: 'test' });

      expect(telemetry.trackError).toHaveBeenCalledWith(
        'String error',
        expect.objectContaining({
          type: 'manual_report',
          context: 'test',
        }),
      );
    });

    it('should work without context', () => {
      reportError('Simple error');

      expect(telemetry.trackError).toHaveBeenCalledWith(
        'Simple error',
        expect.objectContaining({
          type: 'manual_report',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      initializeGlobalErrorHandlers();
    });

    it('should handle errors with no message', () => {
      const error = new Error();
      console.error(error);

      expect(telemetry.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'console_error',
        }),
      );
    });

    it('should handle errors with circular references', () => {
      const error: any = new Error('Circular');
      error.self = error;

      expect(() => reportError(error)).not.toThrow();
      expect(telemetry.trackError).toHaveBeenCalled();
    });
  });
});
