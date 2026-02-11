import { licenseService } from './LicenseService';
import { logger } from '../utils/logger';

/**
 * Background Verifier
 *
 * Periodically checks if license needs verification and verifies when needed.
 * Runs every 6 hours while the application is running.
 */
export class BackgroundVerifier {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Start background verification
   */
  start(): void {
    if (this.checkInterval) {
      logger.info('Background verifier already running');
      return;
    }

    logger.info('Starting background license verifier (checks every 6 hours)');

    // Run initial check after 1 minute
    setTimeout(() => {
      this.performCheck();
    }, 60 * 1000);

    // Then check every 6 hours
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop background verification
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Background license verifier stopped');
    }
  }

  /**
   * Perform verification check
   */
  private async performCheck(): Promise<void> {
    try {
      await licenseService.checkAndVerifyIfNeeded();
      logger.info('Background license verification check completed');
    } catch (error) {
      logger.error('Background license verification failed:', error);
    }
  }

  /**
   * Check if verifier is running
   */
  isRunning(): boolean {
    return this.checkInterval !== null;
  }
}

// Export singleton instance
export const backgroundVerifier = new BackgroundVerifier();
