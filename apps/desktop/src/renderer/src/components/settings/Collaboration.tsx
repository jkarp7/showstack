/**
 * Collaboration Settings Tab
 *
 * Shows the current user's collaboration status and any pending invitations.
 * When canCollaborate is false (demo/student/no-license), shows an upgrade prompt.
 */

import { useEffect, useState } from 'react';
import {
  Users,
  Crown,
  Edit3,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Package,
} from 'lucide-react';
import type { MemberRole } from '../../../../shared/types/collaboration.types';

interface PendingProjectInvitation {
  id: string;
  project_id: string;
  project_name: string;
  email: string;
  role: MemberRole;
  invited_by_email: string;
  invited_at: number;
}

interface PendingShopOrderInvitation {
  id: string;
  shop_order_id: string;
  shop_order_name: string;
  email: string;
  role: MemberRole;
  invited_by_email: string;
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
  const [pendingProjectInvitations, setPendingProjectInvitations] = useState<
    PendingProjectInvitation[]
  >([]);
  const [pendingShopOrderInvitations, setPendingShopOrderInvitations] = useState<
    PendingShopOrderInvitation[]
  >([]);
  const [acting, setActing] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    window.api.license.getStatus().then((status) => {
      setLicenseStatus(status);
    });
    window.api.collaboration.checkPendingProjectInvitations().then((invites) => {
      setPendingProjectInvitations(invites as PendingProjectInvitation[]);
    });
    window.api.collaboration.checkPendingShopOrderInvitations().then((invites) => {
      setPendingShopOrderInvitations(invites as PendingShopOrderInvitation[]);
    });
  }, []);

  const handleAcceptProject = async (invitation: PendingProjectInvitation) => {
    setActing(invitation.project_id);
    setActionMessage(null);
    try {
      const result = await window.api.collaboration.acceptProjectInvitation(invitation.project_id);
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: `You've joined "${invitation.project_name}". It will appear in your project list.`,
        });
        setPendingProjectInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      } else {
        setActionMessage({ type: 'error', text: result.error ?? 'Failed to accept invitation.' });
      }
    } finally {
      setActing(null);
    }
  };

  const handleDeclineProject = async (invitation: PendingProjectInvitation) => {
    setActing(`decline-${invitation.project_id}`);
    setActionMessage(null);
    try {
      const result = await window.api.collaboration.declineProjectInvitation(invitation.project_id);
      if (result.success) {
        setPendingProjectInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      } else {
        setActionMessage({ type: 'error', text: result.error ?? 'Failed to decline invitation.' });
      }
    } finally {
      setActing(null);
    }
  };

  const handleAcceptShopOrder = async (invitation: PendingShopOrderInvitation) => {
    setActing(invitation.shop_order_id);
    setActionMessage(null);
    try {
      const result = await window.api.collaboration.acceptShopOrderInvitation(
        invitation.shop_order_id,
      );
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: `You've joined "${invitation.shop_order_name}". It will appear in your shop orders.`,
        });
        setPendingShopOrderInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      } else {
        setActionMessage({ type: 'error', text: result.error ?? 'Failed to accept invitation.' });
      }
    } finally {
      setActing(null);
    }
  };

  const handleDeclineShopOrder = async (invitation: PendingShopOrderInvitation) => {
    setActing(`decline-${invitation.shop_order_id}`);
    setActionMessage(null);
    try {
      const result = await window.api.collaboration.declineShopOrderInvitation(
        invitation.shop_order_id,
      );
      if (result.success) {
        setPendingShopOrderInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      } else {
        setActionMessage({ type: 'error', text: result.error ?? 'Failed to decline invitation.' });
      }
    } finally {
      setActing(null);
    }
  };

  const canCollaborate = licenseStatus?.canCollaborate ?? false;
  const tier = licenseStatus?.tier ?? null;
  const totalPending = pendingProjectInvitations.length + pendingShopOrderInvitations.length;

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
      {(totalPending > 0 || actionMessage) && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {totalPending > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Pending Invitations ({totalPending})
            </h3>
          )}

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

          {totalPending > 0 && (
            <ul className="space-y-3">
              {pendingProjectInvitations.map((invitation) => {
                const RoleIcon = ROLE_ICONS[invitation.role];
                const isActing = acting === invitation.project_id;
                const isDeclining = acting === `decline-${invitation.project_id}`;
                return (
                  <li
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        Invitation to join &ldquo;{invitation.project_name}&rdquo;
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <RoleIcon className="w-3 h-3 flex-shrink-0" />
                        {ROLE_LABELS[invitation.role]}
                        {invitation.invited_by_email && (
                          <span className="ml-1">· Invited by {invitation.invited_by_email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAcceptProject(invitation)}
                        disabled={isActing || isDeclining}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {isActing ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDeclineProject(invitation)}
                        disabled={isActing || isDeclining}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {isDeclining ? 'Declining…' : 'Decline'}
                      </button>
                    </div>
                  </li>
                );
              })}
              {pendingShopOrderInvitations.map((invitation) => {
                const RoleIcon = ROLE_ICONS[invitation.role];
                const isActing = acting === invitation.shop_order_id;
                const isDeclining = acting === `decline-${invitation.shop_order_id}`;
                return (
                  <li
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        Invitation to join &ldquo;{invitation.shop_order_name}&rdquo;
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <RoleIcon className="w-3 h-3 flex-shrink-0" />
                        {ROLE_LABELS[invitation.role]}
                        {invitation.invited_by_email && (
                          <span className="ml-1">· Invited by {invitation.invited_by_email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAcceptShopOrder(invitation)}
                        disabled={isActing || isDeclining}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {isActing ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDeclineShopOrder(invitation)}
                        disabled={isActing || isDeclining}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {isDeclining ? 'Declining…' : 'Decline'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* How sharing works — visible to all users so they understand the feature */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
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
