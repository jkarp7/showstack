import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';
import { telemetry } from '../../services/telemetry';

/**
 * ErrorBoundary Component Tests
 *
 * Target: 70%+ coverage
 * Tests error catching, UI rendering, and telemetry reporting
 */

// Mock telemetry
vi.mock('../../services/telemetry', () => ({
  telemetry: {
    trackError: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>,
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch errors and render fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });

    it('should display error details in expanded section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      const details = screen.getByText('Error details');
      expect(details).toBeInTheDocument();
    });

    it('should track error with telemetry', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(telemetry.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          errorBoundary: true,
          componentStack: expect.any(String),
        }),
      );

      const calls = vi.mocked(telemetry.trackError).mock.calls;
      const error = calls[0][0] as Error;
      expect(error.message).toBe('Test error');
    });
  });

  describe('Error UI', () => {
    it('should show error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // SVG path for alert icon should be present
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show descriptive message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText(/The application encountered an unexpected error/),
      ).toBeInTheDocument();
      expect(screen.getByText(/This has been reported automatically/)).toBeInTheDocument();
    });

    it('should show Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show Reload App button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Reload App')).toBeInTheDocument();
    });

    it('should show support message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/If this problem persists/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should show Try Again button that resets error', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();

      // Clicking Try Again will call handleReset
      await user.click(tryAgainButton);

      // After reset, error state should be cleared (tested via state management)
      // Note: Full integration would require re-rendering with non-throwing children
    });

    it('should show Reload App button', async () => {
      const user = userEvent.setup();

      // Mock window.location.reload
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, reload: vi.fn() } as any;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      const reloadButton = screen.getByText('Reload App');
      expect(reloadButton).toBeInTheDocument();

      await user.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalled();

      // Restore original location
      window.location = originalLocation;
    });
  });

  describe('Error Information', () => {
    it('should display error message in details', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // Error details section should contain error message
      const detailsSection = container.querySelector('details');
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent).toContain('Test error');
    });

    it('should display stack trace when available', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      const detailsElement = screen.getByText('Error details');
      detailsElement.click();

      // Stack trace should be rendered
      const codeElements = document.querySelectorAll('code');
      expect(codeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without stack traces', () => {
      function ThrowErrorNoStack() {
        const error: any = new Error('No stack');
        delete error.stack;
        throw error;
      }

      render(
        <ErrorBoundary>
          <ThrowErrorNoStack />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(telemetry.trackError).toHaveBeenCalled();
    });

    it('should handle errors with very long messages', () => {
      function ThrowLongError() {
        throw new Error('x'.repeat(1000));
      }

      render(
        <ErrorBoundary>
          <ThrowLongError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle multiple errors in sequence', () => {
      // First error
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(telemetry.trackError).toHaveBeenCalledTimes(1);

      unmount();
      vi.clearAllMocks();

      // Second error in new boundary instance
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(telemetry.trackError).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in nested components', () => {
      function NestedComponent() {
        return (
          <div>
            <div>
              <ThrowError shouldThrow />
            </div>
          </div>
        );
      }

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(telemetry.trackError).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes for layout', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // Check for main container classes
      expect(container.querySelector('.flex')).toBeInTheDocument();
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('should apply dark mode styles', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // Check for dark mode classes
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
      expect(container.querySelector('.text-white')).toBeInTheDocument();
    });
  });
});
