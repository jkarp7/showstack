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
  /**
   * Whether the user is eligible to receive collaboration invitations.
   * True for any authenticated, non-demo licensed user.
   * Distinct from `canCollaborate` (which gates *sending* invitations and
   * requires a Professional/Institutional tier).
   *
   * TODO: Student tier eligibility for receiving invitations is TBD — currently
   * treated as eligible (same as professional/institutional).
   */
  canReceiveInvitations: boolean;
}

const DISMISSED_KEY = 'pendingInvitationsBanner.dismissed';

export function PendingInvitationsBanner({ canReceiveInvitations }: PendingInvitationsBannerProps) {
  const [count, setCount] = useState(0);
  // Persist dismissed state for the session so re-mounting (e.g. navigating away and back)
  // doesn't re-show the banner until the next app launch.
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === 'true',
  );
  const navigate = useNavigate();

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  useEffect(() => {
    if (!canReceiveInvitations) return;

    const check = () => {
      Promise.all([
        window.api.collaboration.checkPendingProjectInvitations(),
        window.api.collaboration.checkPendingShopOrderInvitations(),
      ]).then(([projectInvites, shopOrderInvites]) => {
        setCount(projectInvites.length + shopOrderInvites.length);
      });
    };

    check();

    // Debounce focus re-checks — the user may trigger multiple focus events
    // in rapid succession (e.g. alt-tab back) but a single RPC call is enough.
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedCheck = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, 500);
    };

    // Re-check when the app window regains focus so the count stays current after
    // the user accepts or declines an invitation in the Settings tab.
    window.addEventListener('focus', debouncedCheck);
    return () => {
      window.removeEventListener('focus', debouncedCheck);
      clearTimeout(debounceTimer);
    };
  }, [canReceiveInvitations]);

  if (!canReceiveInvitations || count === 0 || dismissed) return null;

  return (
    <div className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        <span>
          You have {count} pending collaboration invitation{count !== 1 ? 's' : ''}.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/settings', { state: { tab: 'collaboration' } })}
          className="font-medium underline hover:no-underline"
        >
          View Invitations
        </button>
        <button onClick={dismiss} className="opacity-75 hover:opacity-100" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
