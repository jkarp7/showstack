/**
 * Password policy constants and validator — single source of truth for both
 * the main process (IPC handler) and the renderer (SetPasswordForm).
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIRES_NUMBER = true;

/**
 * Returns an error message string if the password is invalid, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (PASSWORD_REQUIRES_NUMBER && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}
