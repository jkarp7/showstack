/**
 * OfflineBanner Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  WifiOff: () => <div data-testid="icon-wifioff" />,
  X: () => <div data-testid="icon-x" />,
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="icon-refreshcw" className={className} />
  ),
}));

// Mock the authStore
const mockAuthStore = {
  isAuthenticated: true,
  isCloudConfigured: true,
  syncStatus: {
    state: 'disconnected' as const,
    hasPendingChanges: false,
  },
};

vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockAuthStore);
    }
    return mockAuthStore;
  }),
}));

// Mock window.api.sync
const mockSyncInitialize = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncInitialize.mockResolvedValue(undefined);

  // Reset mock store to default state
  mockAuthStore.isAuthenticated = true;
  mockAuthStore.isCloudConfigured = true;
  mockAuthStore.syncStatus = {
    state: 'disconnected',
    hasPendingChanges: false,
  };

  // Setup window.api mock
  Object.defineProperty(window, 'api', {
    value: {
      sync: {
        initialize: mockSyncInitialize,
      },
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OfflineBanner', () => {
  describe('visibility conditions', () => {
    it('renders when disconnected and cloud is configured', () => {
      render(<OfflineBanner />);
      expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('renders when in error state', () => {
      mockAuthStore.syncStatus.state = 'error';
      render(<OfflineBanner />);
      expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('does not render when cloud is not configured', () => {
      mockAuthStore.isCloudConfigured = false;
      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when not authenticated', () => {
      mockAuthStore.isAuthenticated = false;
      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when connected', () => {
      mockAuthStore.syncStatus.state = 'connected';
      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when syncing', () => {
      mockAuthStore.syncStatus.state = 'syncing';
      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('content display', () => {
    it('shows pending changes message when there are pending changes', () => {
      mockAuthStore.syncStatus.hasPendingChanges = true;
      render(<OfflineBanner />);
      expect(screen.getByText('Changes will sync when you reconnect.')).toBeInTheDocument();
    });

    it('shows saved locally message when no pending changes', () => {
      mockAuthStore.syncStatus.hasPendingChanges = false;
      render(<OfflineBanner />);
      expect(screen.getByText('Your work is saved locally.')).toBeInTheDocument();
    });
  });

  describe('dismiss functionality', () => {
    it('hides banner when dismiss button is clicked', () => {
      const { container } = render(<OfflineBanner />);

      // Banner should be visible initially
      expect(screen.getByText("You're offline")).toBeInTheDocument();

      // Click dismiss button
      const dismissButton = screen.getByTitle('Dismiss');
      fireEvent.click(dismissButton);

      // Banner should be hidden
      expect(container.firstChild).toBeNull();
    });
  });

  describe('retry functionality', () => {
    it('calls sync initialize when retry is clicked', async () => {
      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockSyncInitialize).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during retry', async () => {
      // Make the sync initialize hang
      mockSyncInitialize.mockImplementation(() => new Promise(() => {}));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
      });
    });

    it('disables retry button while reconnecting', async () => {
      mockSyncInitialize.mockImplementation(() => new Promise(() => {}));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(retryButton).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('displays network error message', async () => {
      mockSyncInitialize.mockRejectedValue(new Error('network error'));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Network unavailable. Check your internet connection.')).toBeInTheDocument();
      });
    });

    it('displays fetch error message', async () => {
      mockSyncInitialize.mockRejectedValue(new Error('fetch failed'));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Network unavailable. Check your internet connection.')).toBeInTheDocument();
      });
    });

    it('displays auth error message', async () => {
      mockSyncInitialize.mockRejectedValue(new Error('unauthorized'));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Please sign in again.')).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      mockSyncInitialize.mockRejectedValue(new Error('something went wrong'));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Connection failed: something went wrong')).toBeInTheDocument();
      });
    });

    it('displays fallback error for non-Error objects', async () => {
      mockSyncInitialize.mockRejectedValue('string error');

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Connection failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('re-enables retry button after error', async () => {
      mockSyncInitialize.mockRejectedValue(new Error('network error'));

      render(<OfflineBanner />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(retryButton).not.toBeDisabled();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });
});
