import { licenseService } from './LicenseService';

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
      console.log('Background verifier already running');
      return;
    }

    console.log('Starting background license verifier (checks every 6 hours)');

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
      console.log('Background license verifier stopped');
    }
  }

  /**
   * Perform verification check
   */
  private async performCheck(): Promise<void> {
    try {
      await licenseService.checkAndVerifyIfNeeded();
      console.log('Background license verification check completed');
    } catch (error) {
      console.error('Background license verification failed:', error);
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
