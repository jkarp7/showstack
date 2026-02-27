import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

interface UseSaveAsCopyResult {
  isCopying: boolean;
  copyMessage: string | null;
  handleSaveAsCopy: () => Promise<void>;
  /** Show an arbitrary message in the same toast, auto-dismissed after durationMs. */
  showCopyMessage: (message: string, durationMs?: number) => void;
}

/**
 * Encapsulates the "Save as Copy" interaction: calls the IPC API, guards
 * against concurrent invocations, manages the auto-dismissing toast message,
 * and cleans up the timer on unmount.
 *
 * @param projectId  The project to copy. When null/undefined the handler is a no-op.
 * @param onSuccess  Optional callback invoked after a successful copy (e.g. reload data).
 */
export function useSaveAsCopy(
  projectId: string | null | undefined,
  onSuccess?: () => void | Promise<void>,
): UseSaveAsCopyResult {
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const isCopyingRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleMessageDismiss = useCallback((delayMs: number) => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyMessage(null), delayMs);
  }, []);

  const showCopyMessage = useCallback(
    (message: string, durationMs = 4000) => {
      setCopyMessage(message);
      scheduleMessageDismiss(durationMs);
    },
    [scheduleMessageDismiss],
  );

  const handleSaveAsCopy = useCallback(async () => {
    if (!projectId || isCopyingRef.current) return;

    try {
      isCopyingRef.current = true;
      setIsCopying(true);
      setCopyMessage(null);

      const copy = await window.api.projects.createCopy(projectId);
      setCopyMessage(`Copy created: "${copy.name}"`);
      scheduleMessageDismiss(4000);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      logger.error('Failed to create project copy:', error);
      setCopyMessage('Failed to create copy');
      scheduleMessageDismiss(3000);
    } finally {
      isCopyingRef.current = false;
      setIsCopying(false);
    }
  }, [projectId, onSuccess, scheduleMessageDismiss]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  return { isCopying, copyMessage, handleSaveAsCopy, showCopyMessage };
}
