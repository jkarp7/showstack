/**
 * Collaboration Settings Tab Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collaboration } from '../Collaboration';

const pendingProjectInvite = {
  id: 'pi1',
  project_id: 'proj-1',
  project_name: 'Summer Festival',
  email: 'me@example.com',
  role: 'editor' as const,
  invited_by_email: 'boss@example.com',
  invited_at: Date.now(),
};

const pendingShopOrderInvite = {
  id: 'si1',
  shop_order_id: 'so-1',
  shop_order_name: 'Main Stage Order',
  email: 'me@example.com',
  role: 'viewer' as const,
  invited_by_email: 'boss@example.com',
  invited_at: Date.now(),
};

describe('Collaboration settings tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.api.license.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      canCollaborate: true,
      tier: 'professional',
    });
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
  });

  it('renders the heading and how-sharing-works section', async () => {
    render(<Collaboration />);
    await waitFor(() => {
      expect(screen.getByText(/Collaboration/i)).toBeTruthy();
      expect(screen.getByText(/How Sharing Works/i)).toBeTruthy();
    });
  });

  it('shows upgrade prompt when canCollaborate is false', async () => {
    (window.api.license.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      canCollaborate: false,
      tier: 'student',
    });

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/Upgrade to collaborate/i)).toBeTruthy();
    });
  });

  it('shows sign-in prompt when no license (demo tier)', async () => {
    (window.api.license.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      canCollaborate: false,
      tier: 'demo',
    });

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to collaborate/i)).toBeTruthy();
    });
  });

  it('does not show pending section when there are no invitations', async () => {
    render(<Collaboration />);
    await waitFor(() =>
      expect(window.api.collaboration.checkPendingProjectInvitations).toHaveBeenCalled(),
    );
    expect(screen.queryByText(/Pending Invitations/i)).toBeNull();
  });

  it('shows pending project invitations', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingProjectInvite]);

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/Summer Festival/i)).toBeTruthy();
      expect(screen.getByText(/boss@example.com/i)).toBeTruthy();
    });
  });

  it('shows pending shop order invitations', async () => {
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingShopOrderInvite]);

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/Main Stage Order/i)).toBeTruthy();
    });
  });

  it('shows combined count from both invitation types', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingProjectInvite]);
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingShopOrderInvite]);

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/Pending Invitations \(2\)/i)).toBeTruthy();
    });
  });

  it('accepts a project invitation', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingProjectInvite]);
    (
      window.api.collaboration.acceptProjectInvitation as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ success: true });

    render(<Collaboration />);

    await waitFor(() => screen.getAllByRole('button', { name: /Accept/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /Accept/i })[0]);

    await waitFor(() => {
      expect(window.api.collaboration.acceptProjectInvitation).toHaveBeenCalledWith('proj-1');
      // The invitation is removed from the list and a success message is shown
      expect(screen.getByText(/you've joined/i)).toBeTruthy();
    });
  });

  it('declines a project invitation', async () => {
    (
      window.api.collaboration.checkPendingProjectInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingProjectInvite]);
    (
      window.api.collaboration.declineProjectInvitation as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ success: true });

    render(<Collaboration />);

    await waitFor(() => screen.getAllByRole('button', { name: /Decline/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /Decline/i })[0]);

    await waitFor(() => {
      expect(window.api.collaboration.declineProjectInvitation).toHaveBeenCalledWith('proj-1');
    });
  });

  it('accepts a shop order invitation', async () => {
    (
      window.api.collaboration.checkPendingShopOrderInvitations as ReturnType<typeof vi.fn>
    ).mockResolvedValue([pendingShopOrderInvite]);
    (
      window.api.collaboration.acceptShopOrderInvitation as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ success: true });

    render(<Collaboration />);

    await waitFor(() => screen.getAllByRole('button', { name: /Accept/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /Accept/i })[0]);

    await waitFor(() => {
      expect(window.api.collaboration.acceptShopOrderInvitation).toHaveBeenCalledWith('so-1');
    });
  });

  it('shows How Sharing Works section even when canCollaborate is false', async () => {
    (window.api.license.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      canCollaborate: false,
      tier: 'student',
    });

    render(<Collaboration />);

    await waitFor(() => {
      expect(screen.getByText(/How Sharing Works/i)).toBeTruthy();
    });
  });
});
