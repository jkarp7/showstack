import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthPanel } from '../HealthPanel';

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Activity: (props: any) => <div data-testid="icon-activity" {...props} />,
  Database: (props: any) => <div data-testid="icon-database" {...props} />,
  HardDrive: (props: any) => <div data-testid="icon-harddrive" {...props} />,
  Cpu: (props: any) => <div data-testid="icon-cpu" {...props} />,
  Cloud: (props: any) => <div data-testid="icon-cloud" {...props} />,
  RefreshCw: (props: any) => <div data-testid="icon-refreshcw" {...props} />,
  CheckCircle: (props: any) => <div data-testid="icon-checkcircle" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="icon-alerttriangle" {...props} />,
  XCircle: (props: any) => <div data-testid="icon-xcircle" {...props} />,
}));

import { logger } from '../../../utils/logger';

const mockHealthCheck = vi.fn();

const healthyReport = {
  status: 'healthy' as const,
  timestamp: new Date().toISOString(),
  checks: {
    database: { status: 'healthy' as const, message: 'Both databases responding' },
    filesystem: {
      status: 'healthy' as const,
      message: 'Filesystem accessible',
      details: { path: '/tmp/data', freeSpaceMB: 50000 },
    },
    memory: { status: 'healthy' as const, message: 'Memory OK: 150MB heap used' },
    sync: { status: 'healthy' as const, message: 'Sync connected' },
  },
};

const degradedReport = {
  status: 'degraded' as const,
  timestamp: new Date().toISOString(),
  checks: {
    database: { status: 'healthy' as const, message: 'Both databases responding' },
    filesystem: { status: 'healthy' as const, message: 'Filesystem accessible' },
    memory: { status: 'degraded' as const, message: 'Heap usage elevated: 1200MB' },
    sync: { status: 'healthy' as const, message: 'Sync connected' },
  },
};

describe('HealthPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).api = {
      ...(window as any).api,
      health: { check: mockHealthCheck },
    };
  });

  it('auto-runs health check on mount', async () => {
    mockHealthCheck.mockResolvedValue(healthyReport);
    render(<HealthPanel />);

    await waitFor(() => {
      expect(mockHealthCheck).toHaveBeenCalledTimes(1);
    });
  });

  it('displays overall status badge', async () => {
    mockHealthCheck.mockResolvedValue(healthyReport);
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('Overall Status')).toBeInTheDocument();
    });
    // Multiple "Healthy" badges (overall + each check card)
    expect(screen.getAllByText('Healthy').length).toBeGreaterThanOrEqual(1);
  });

  it('displays degraded status', async () => {
    mockHealthCheck.mockResolvedValue(degradedReport);
    render(<HealthPanel />);

    await waitFor(() => {
      // Overall badge + memory check badge both show "Degraded"
      expect(screen.getAllByText('Degraded').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders all 4 check cards', async () => {
    mockHealthCheck.mockResolvedValue(healthyReport);
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('Database')).toBeInTheDocument();
    });
    expect(screen.getByText('Filesystem')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Cloud Sync')).toBeInTheDocument();
  });

  it('shows check details when present', async () => {
    mockHealthCheck.mockResolvedValue(healthyReport);
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText(/freeSpaceMB/)).toBeInTheDocument();
    });
  });

  it('refresh button triggers new health check', async () => {
    const user = userEvent.setup();
    mockHealthCheck.mockResolvedValue(healthyReport);

    let now = 10000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('Run Health Check')).toBeInTheDocument();
    });

    // Advance past the 5s cooldown
    now += 6000;
    await user.click(screen.getByText('Run Health Check'));

    // Once on mount + once on click
    expect(mockHealthCheck).toHaveBeenCalledTimes(2);

    vi.restoreAllMocks();
  });

  it('shows spinner text during check', async () => {
    // Make the check hang so we can observe loading state
    let resolveCheck: (value: any) => void;
    mockHealthCheck.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    render(<HealthPanel />);

    expect(screen.getByText('Checking...')).toBeInTheDocument();

    // Resolve to clean up
    resolveCheck!(healthyReport);
    await waitFor(() => {
      expect(screen.getByText('Run Health Check')).toBeInTheDocument();
    });
  });

  it('disables button while checking', async () => {
    let resolveCheck: (value: any) => void;
    mockHealthCheck.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    render(<HealthPanel />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    resolveCheck!(healthyReport);
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });

  it('handles API error gracefully', async () => {
    mockHealthCheck.mockRejectedValue(new Error('API unavailable'));
    render(<HealthPanel />);

    await waitFor(() => {
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Health check failed',
        expect.any(Error),
      );
    });

    // Should not crash — empty state shown
    expect(screen.getByText('Click "Run Health Check" to check system health')).toBeInTheDocument();
  });

  it('shows empty state when no report and not checking', async () => {
    // Resolve immediately with no data to get to empty-ish state
    mockHealthCheck.mockRejectedValue(new Error('fail'));
    render(<HealthPanel />);

    await waitFor(() => {
      expect(
        screen.getByText('Click "Run Health Check" to check system health'),
      ).toBeInTheDocument();
    });
  });
});
