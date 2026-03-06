/**
 * PendingInvitationsBanner
 *
 * Displayed at the top of the app when the current user has pending project
 * invitations. Clicking "View Invitations" opens the Collaboration settings tab.
 * Only shown when featureFlags.collaboration is enabled.
 */

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingInvitationsBannerProps {
  /** Whether the user has an active collaboration-capable license. */
  canCollaborate: boolean;
}

export function PendingInvitationsBanner({ canCollaborate }: PendingInvitationsBannerProps) {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canCollaborate) return;

    window.api.collaboration.checkPendingProjectInvitations().then((invites) => {
      setCount(invites.length);
    });
  }, [canCollaborate]);

  if (!canCollaborate || count === 0 || dismissed) return null;

  return (
    <div className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        <span>
          You have {count} pending project invitation{count !== 1 ? 's' : ''}.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/settings')}
          className="font-medium underline hover:no-underline"
        >
          View Invitations
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-75 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
