/**
 * Collaboration Settings Tab
 *
 * Shows the current user's collaboration status and any pending invitations.
 * When canCollaborate is false (demo/student/no-license), shows an upgrade prompt.
 */

import { useEffect, useState } from 'react';
import { Users, Crown, Edit3, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type MemberRole = 'owner' | 'editor' | 'viewer';
type MemberStatus = 'pending' | 'accepted' | 'declined';

interface ProjectMember {
  id: string;
  project_id: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  invited_at: number;
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

export function Collaboration() {
  const [licenseStatus, setLicenseStatus] = useState<{
    canCollaborate: boolean;
    tier: string | null;
  } | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<ProjectMember[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    window.api.license.getStatus().then((status) => {
      setLicenseStatus(status);
    });
    window.api.collaboration.checkPendingProjectInvitations().then((invites) => {
      setPendingInvitations(invites as ProjectMember[]);
    });
  }, []);

  const handleAccept = async (invitation: ProjectMember) => {
    setAccepting(invitation.project_id);
    setActionMessage(null);
    try {
      const result = await window.api.collaboration.acceptProjectInvitation(invitation.project_id);
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: 'Invitation accepted! The project will appear in your project list.',
        });
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      } else {
        setActionMessage({ type: 'error', text: result.error ?? 'Failed to accept invitation.' });
      }
    } finally {
      setAccepting(null);
    }
  };

  const canCollaborate = licenseStatus?.canCollaborate ?? false;
  const tier = licenseStatus?.tier ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collaboration</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Share projects and collaborate with team members in real time.
        </p>
      </div>

      {/* License gate */}
      {!canCollaborate && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                {tier === 'demo' || tier === null
                  ? 'Sign in to collaborate'
                  : 'Upgrade to collaborate'}
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {tier === 'demo' || tier === null
                  ? 'Collaboration requires a ShowStack account. Sign in or create an account to get started.'
                  : 'Collaboration is available on Professional and Institutional plans. Upgrade your license to invite team members.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Pending Invitations
          </h3>

          {actionMessage && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                actionMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              {actionMessage.text}
            </div>
          )}

          <ul className="space-y-3">
            {pendingInvitations.map((invitation) => {
              const RoleIcon = ROLE_ICONS[invitation.role];
              return (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Project invitation
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <RoleIcon className="w-3 h-3" />
                      {ROLE_LABELS[invitation.role]}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(invitation)}
                    disabled={accepting === invitation.project_id}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    {accepting === invitation.project_id ? 'Accepting…' : 'Accept'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* How sharing works */}
      <section
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${!canCollaborate ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          How Sharing Works
        </h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Owner</span> — full
              control including inviting and removing members
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Edit3 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Editor</span> — can view
              and edit all fixture data; changes sync to all collaborators
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Viewer</span> — read-only
              access; edits are not allowed
            </div>
          </div>
          <p className="pt-2 text-xs text-gray-500 dark:text-gray-500">
            To share a project, open it and click the <strong>Share</strong> button in the toolbar.
          </p>
        </div>
      </section>
    </div>
  );
}
