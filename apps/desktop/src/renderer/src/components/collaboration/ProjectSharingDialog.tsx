/**
 * ProjectSharingDialog
 *
 * Modal for managing project collaborators. Shows current members with their
 * roles, allows the project owner to invite by email, and allows removing
 * members. Gated behind featureFlags.collaboration && license.canCollaborate.
 *
 * Usage:
 *   <ProjectSharingDialog
 *     projectId={project.id}
 *     projectOwnerId={project.user_id}
 *     currentUserId={userId}
 *     open={sharingOpen}
 *     onClose={() => setSharingOpen(false)}
 *   />
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Users, UserPlus, Trash2, AlertCircle, Crown, Edit3, Eye } from 'lucide-react';

type MemberRole = 'owner' | 'editor' | 'viewer';
type MemberStatus = 'pending' | 'accepted' | 'declined';

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  email: string;
  role: MemberRole;
  invited_by: string;
  status: MemberStatus;
  invited_at: number;
  accepted_at: number | null;
}

interface ProjectSharingDialogProps {
  projectId: string;
  /** The user_id of the project owner — determines if the current user can invite/remove. */
  projectOwnerId: string;
  /** The current signed-in user's ID. */
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}

const ROLE_ICONS: Record<MemberRole, React.FC<{ className?: string }>> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function ProjectSharingDialog({
  projectId,
  projectOwnerId,
  currentUserId,
  open,
  onClose,
}: ProjectSharingDialogProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Ownership is stored on the project row (projects.user_id), not in project_members.
  // project_members only contains invited collaborators, never the owner themselves.
  const isOwner = currentUserId === projectOwnerId;

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.collaboration.getProjectMembers(projectId);
      setMembers(result as ProjectMember[]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      loadMembers();
      setInviteEmail('');
      setInviteRole('editor');
      setInviteError(null);
      setInviteSuccess(null);
      setRemoveError(null);
    }
  }, [open, loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail.trim()) {
      setInviteError('Email is required.');
      return;
    }

    setInviting(true);
    try {
      const result = await window.api.collaboration.inviteToProject(
        projectId,
        inviteEmail.trim(),
        inviteRole,
      );
      if (result.success) {
        setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
        setInviteEmail('');
        await loadMembers();
      } else {
        setInviteError(result.error ?? 'Failed to send invitation.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: ProjectMember) => {
    if (!member.user_id) return;
    setRemoveError(null);

    const result = await window.api.collaboration.removeProjectMember(projectId, member.user_id);
    if (result.success) {
      await loadMembers();
    } else {
      setRemoveError(result.error ?? 'Failed to remove member.');
    }
  };

  if (!open) return null;

  const accepted = members.filter((m) => m.status === 'accepted');
  const pending = members.filter((m) => m.status === 'pending');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Share Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Invite form — owners only */}
          {isOwner && (
            <section>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                Invite Collaborator
              </h3>
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    {inviting ? 'Sending…' : 'Invite'}
                  </button>
                </div>
                {inviteError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {inviteError}
                  </p>
                )}
                {inviteSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">{inviteSuccess}</p>
                )}
              </form>
            </section>
          )}

          {/* Current members */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {accepted.length === 0 ? 'No members yet' : `Members (${accepted.length})`}
            </h3>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {accepted.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role];
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {member.email[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <RoleIcon className="w-3 h-3" />
                            {ROLE_LABELS[member.role]}
                          </div>
                        </div>
                      </div>
                      {isOwner && member.role !== 'owner' && member.user_id && (
                        <button
                          onClick={() => handleRemove(member)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Pending invitations */}
          {pending.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pending Invitations ({pending.length})
              </h3>
              <ul className="space-y-2">
                {pending.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {member.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ROLE_LABELS[member.role]} · Invitation pending
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {removeError && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {removeError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
