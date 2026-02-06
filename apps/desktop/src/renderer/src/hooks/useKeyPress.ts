import { useEffect, useState } from 'react';

/**
 * Hook to detect when a specific key is pressed
 * Useful for keyboard shortcuts and hotkeys
 *
 * @example
 * const enterPressed = useKeyPress('Enter');
 * const escapePressed = useKeyPress('Escape');
 * const ctrlS = useKeyPress('s', { ctrl: true });
 *
 * useEffect(() => {
 *   if (enterPressed) {
 *     submitForm();
 *   }
 * }, [enterPressed]);
 */
export function useKeyPress(
  targetKey: string,
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  },
): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      // Check if the target key matches
      if (event.key !== targetKey) return;

      // Check modifiers
      if (modifiers?.ctrl && !event.ctrlKey) return;
      if (modifiers?.alt && !event.altKey) return;
      if (modifiers?.shift && !event.shiftKey) return;
      if (modifiers?.meta && !event.metaKey) return;

      setKeyPressed(true);
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey, modifiers]);

  return keyPressed;
}
