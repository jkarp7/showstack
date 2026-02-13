import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogLevel } from '../logger';

vi.mock('../../services/sentry', () => ({
  captureError: vi.fn(),
  isSentryInitialized: vi.fn(),
}));

import { captureError, isSentryInitialized } from '../../services/sentry';

const mockedCaptureError = vi.mocked(captureError);
const mockedIsSentryInitialized = vi.mocked(isSentryInitialized);

describe('RendererLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset module cache so constructor re-reads import.meta.env.DEV
    vi.resetModules();
  });

  async function createLogger(isDev: boolean) {
    vi.stubEnv('DEV', isDev ? 'true' : '');
    // import.meta.env.DEV is a boolean in Vite — we need to set it directly
    (import.meta.env as any).DEV = isDev;
    const mod = await import('../logger');
    return new mod.RendererLogger();
  }

  describe('formatMessage', () => {
    it('includes ISO timestamp and level in formatted output', async () => {
      const logger = await createLogger(true);
      logger.info('test message');

      const call = vi.mocked(console.log).mock.calls[0][0] as string;
      expect(call).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] test message$/,
      );
    });
  });

  describe('debug', () => {
    it('logs when import.meta.env.DEV is true', async () => {
      const logger = await createLogger(true);
      logger.debug('debug msg');

      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(vi.mocked(console.debug).mock.calls[0][0]).toContain('[DEBUG] debug msg');
    });

    it('suppresses output in production', async () => {
      const logger = await createLogger(false);
      logger.debug('should not appear');

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('always logs with formatted message', async () => {
      const logger = await createLogger(false);
      logger.info('info msg');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(vi.mocked(console.log).mock.calls[0][0]).toContain('[INFO] info msg');
    });

    it('passes context when provided', async () => {
      const logger = await createLogger(true);
      const ctx = { key: 'value' };
      logger.info('with context', ctx);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), ctx);
    });
  });

  describe('warn', () => {
    it('always logs with formatted message', async () => {
      const logger = await createLogger(false);
      logger.warn('warn msg');

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('[WARN] warn msg');
    });

    it('passes context when provided', async () => {
      const logger = await createLogger(true);
      const ctx = { detail: 123 };
      logger.warn('with context', ctx);

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), ctx);
    });
  });

  describe('error', () => {
    it('extracts name/message/stack from Error object and forwards to Sentry', async () => {
      mockedIsSentryInitialized.mockReturnValue(true);
      const logger = await createLogger(true);
      const err = new Error('test error');

      logger.error('something failed', err);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] something failed'),
        expect.objectContaining({
          name: 'Error',
          message: 'test error',
          stack: expect.any(String),
        }),
      );
      expect(mockedCaptureError).toHaveBeenCalledWith(err);
    });

    it('passes LogContext and creates new Error for Sentry', async () => {
      mockedIsSentryInitialized.mockReturnValue(true);
      const logger = await createLogger(true);
      const ctx = { userId: 'abc' };

      logger.error('context error', ctx);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] context error'),
        ctx,
      );
      expect(mockedCaptureError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'context error' }),
        ctx,
      );
    });

    it('creates new Error for Sentry when no context provided', async () => {
      mockedIsSentryInitialized.mockReturnValue(true);
      const logger = await createLogger(true);

      logger.error('bare error');

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] bare error'));
      expect(mockedCaptureError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'bare error' }),
      );
    });

    it('skips Sentry when not initialized', async () => {
      mockedIsSentryInitialized.mockReturnValue(false);
      const logger = await createLogger(true);

      logger.error('no sentry', new Error('test'));

      expect(console.error).toHaveBeenCalled();
      expect(mockedCaptureError).not.toHaveBeenCalled();
    });
  });

  describe('getEnvironment', () => {
    it('returns "development" when DEV is true', async () => {
      const logger = await createLogger(true);
      expect(logger.getEnvironment()).toBe('development');
    });

    it('returns "production" when DEV is false', async () => {
      const logger = await createLogger(false);
      expect(logger.getEnvironment()).toBe('production');
    });
  });
});
