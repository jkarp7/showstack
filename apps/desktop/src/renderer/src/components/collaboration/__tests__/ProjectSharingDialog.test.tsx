/**
 * ProjectSharingDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSharingDialog } from '../ProjectSharingDialog';

const OWNER_ID = 'owner-uid';
const OTHER_ID = 'other-uid';

const defaultProps = {
  projectId: 'proj-1',
  projectName: 'Test Show',
  projectOwnerId: OWNER_ID,
  currentUserId: OWNER_ID,
  open: true,
  onClose: vi.fn(),
};

const acceptedMember = {
  id: 'm1',
  project_id: 'proj-1',
  user_id: 'user-abc',
  email: 'alice@example.com',
  role: 'editor' as const,
  invited_by: OWNER_ID,
  status: 'accepted' as const,
  invited_at: Date.now(),
  accepted_at: Date.now(),
};

const pendingMember = {
  id: 'm2',
  project_id: 'proj-1',
  user_id: null,
  email: 'bob@example.com',
  role: 'viewer' as const,
  invited_by: OWNER_ID,
  status: 'pending' as const,
  invited_at: Date.now(),
  accepted_at: null,
};

describe('ProjectSharingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.api.collaboration.getProjectMembers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('renders nothing when open is false', () => {
    render(<ProjectSharingDialog {...defaultProps} open={false} />);
    expect(screen.queryByText(/Share Project/i)).toBeNull();
  });

  it('loads and displays accepted members on open', async () => {
    (window.api.collaboration.getProjectMembers as ReturnType<typeof vi.fn>).mockResolvedValue([
      acceptedMember,
    ]);

    render(<ProjectSharingDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeTruthy();
    });
  });

  it('shows the invite form for the project owner', async () => {
    render(<ProjectSharingDialog {...defaultProps} currentUserId={OWNER_ID} />);
    await waitFor(() => screen.getByPlaceholderText(/colleague@example.com/i));
    expect(screen.getByText(/Invite Collaborator/i)).toBeTruthy();
  });

  it('hides the invite form for non-owners', async () => {
    render(
      <ProjectSharingDialog {...defaultProps} currentUserId={OTHER_ID} projectOwnerId={OWNER_ID} />,
    );
    await waitFor(() => expect(window.api.collaboration.getProjectMembers).toHaveBeenCalled());
    expect(screen.queryByText(/Invite Collaborator/i)).toBeNull();
  });

  it('sends an invitation and refreshes the member list', async () => {
    (window.api.collaboration.inviteToProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<ProjectSharingDialog {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/colleague@example.com/i));

    await userEvent.type(
      screen.getByPlaceholderText(/colleague@example.com/i),
      'charlie@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Invite$/i }));

    await waitFor(() => {
      expect(window.api.collaboration.inviteToProject).toHaveBeenCalledWith(
        'proj-1',
        'Test Show',
        'charlie@example.com',
        'editor',
      );
    });
  });

  it('displays an invite error when the API call fails', async () => {
    (window.api.collaboration.inviteToProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Already a member',
    });

    render(<ProjectSharingDialog {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/colleague@example.com/i));

    await userEvent.type(screen.getByPlaceholderText(/colleague@example.com/i), 'd@e.com');
    await userEvent.click(screen.getByRole('button', { name: /^Invite$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Already a member/i)).toBeTruthy();
    });
  });

  it('shows pending invitations section', async () => {
    (window.api.collaboration.getProjectMembers as ReturnType<typeof vi.fn>).mockResolvedValue([
      pendingMember,
    ]);

    render(<ProjectSharingDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Pending Invitations/i)).toBeTruthy();
      expect(screen.getByText('bob@example.com')).toBeTruthy();
    });
  });

  it('cancels a pending invitation', async () => {
    (window.api.collaboration.getProjectMembers as ReturnType<typeof vi.fn>).mockResolvedValue([
      pendingMember,
    ]);
    (
      window.api.collaboration.cancelProjectInvitation as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ success: true });

    render(<ProjectSharingDialog {...defaultProps} />);

    await waitFor(() => screen.getByTitle(/Cancel invitation/i));
    await userEvent.click(screen.getByTitle(/Cancel invitation/i));

    await waitFor(() => {
      expect(window.api.collaboration.cancelProjectInvitation).toHaveBeenCalledWith('m2');
    });
  });

  it('removes an accepted member', async () => {
    (window.api.collaboration.getProjectMembers as ReturnType<typeof vi.fn>).mockResolvedValue([
      acceptedMember,
    ]);
    (window.api.collaboration.removeProjectMember as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<ProjectSharingDialog {...defaultProps} />);

    await waitFor(() => screen.getByTitle(/Remove member/i));
    await userEvent.click(screen.getByTitle(/Remove member/i));

    await waitFor(() => {
      expect(window.api.collaboration.removeProjectMember).toHaveBeenCalledWith(
        'proj-1',
        'user-abc',
      );
    });
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    render(<ProjectSharingDialog {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByText(/Share Project/i));
    // The header X button
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find((btn) => btn.querySelector('svg'));
    // Click the first close button (header X)
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
