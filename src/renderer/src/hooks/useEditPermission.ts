import { useState, useEffect } from 'react';
import { useUser } from './useUser';

/**
 * Hook for checking if the user has permission to edit data
 *
 * This is based on license status - expired licenses can view but not edit.
 * Useful for disabling inputs, buttons, and other editing controls when
 * the license has expired.
 *
 * @returns Object with canEdit boolean
 *
 * @example
 * ```tsx
 * const { canEdit } = useEditPermission();
 *
 * return (
 *   <input
 *     disabled={!canEdit}
 *     placeholder={canEdit ? 'Edit fixture' : 'Read-only (license expired)'}
 *   />
 * );
 * ```
 */
export function useEditPermission() {
  const { status } = useUser();
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    if (!status) {
      setCanEdit(true); // Default to allowing edits if status unknown
      return;
    }

    setCanEdit(status.canEdit);
  }, [status]);

  return { canEdit };
}
