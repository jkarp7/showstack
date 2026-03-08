/**
 * PendingInvitationsBanner Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PendingInvitationsBanner } from '../PendingInvitationsBanner';

// useNavigate is provided by MemoryRouter; mock it to capture calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderBanner(canReceiveInvitations = true) {
  return render(
    <MemoryRouter>
      <PendingInvitationsBanner canReceiveInvitations={canReceiveInvitations} />
    </MemoryRouter>,
  );
}

describe('PendingInvitationsBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
  });

  it('renders nothing when canReceiveInvitations is false (e.g. demo tier)', async () => {
    renderBanner(false);
    // Nothing should be in the document — no RPCs called either
    expect(screen.queryByText(/invitation/i)).toBeNull();
    expect(window.api.collaboration.checkPendingProjectInvitations).not.toHaveBeenCalled();
  });

  it('renders nothing when there are no pending invitations', async () => {
    renderBanner();
    await waitFor(() => {
      expect(window.api.collaboration.checkPendingProjectInvitations).toHaveBeenCalled();
    });
    expect(screen.queryByText(/invitation/i)).toBeNull();
  });

  it('shows the banner with correct count for project invitations', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i1' }, { id: 'i2' }]);

    renderBanner();

    await waitFor(() => {
      expect(screen.getByText(/2 pending collaboration invitation/i)).toBeTruthy();
    });
  });

  it('shows the banner with combined count from project and shop order invitations', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i1' }]);
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i2' }, { id: 'i3' }]);

    renderBanner();

    await waitFor(() => {
      expect(screen.getByText(/3 pending collaboration invitation/i)).toBeTruthy();
    });
  });

  it('uses singular form for exactly 1 invitation', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i1' }]);

    renderBanner();

    await waitFor(() => {
      const text = screen.getByText(/1 pending collaboration invitation/i).textContent;
      // Should NOT end with 's' — singular form
      expect(text).not.toMatch(/invitations/i);
    });
  });

  it('navigates to /settings when "View Invitations" is clicked', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i1' }]);

    renderBanner();

    await waitFor(() => screen.getByText(/View Invitations/i));
    await userEvent.click(screen.getByText(/View Invitations/i));

    expect(mockNavigate).toHaveBeenCalledWith('/settings', { state: { tab: 'collaboration' } });
  });

  it('hides the banner when dismissed', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'i1' }]);

    renderBanner();

    await waitFor(() => screen.getByLabelText(/Dismiss/i));
    await userEvent.click(screen.getByLabelText(/Dismiss/i));

    expect(screen.queryByText(/invitation/i)).toBeNull();
  });
});
