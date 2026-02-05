/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number for display
 * - US/Canada numbers (10 digits): (XXX) XXX-XXXX
 * - International numbers: Leave as-is or with minimal formatting
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove all non-digit characters to analyze
  const digits = phone.replace(/\D/g, '');

  // Check if it's a 10-digit US/Canada number
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Check if it starts with +1 (US/Canada with country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Check if it starts with + (international)
  if (phone.trim().startsWith('+')) {
    // UK numbers: +44
    if (digits.startsWith('44')) {
      // Common UK format: +44 20 XXXX XXXX (London) or +44 XXXX XXX XXX
      const countryCode = '44';
      const restDigits = digits.slice(2);

      if (restDigits.length >= 10) {
        // Format as +44 XX XXXX XXXX
        return `+${countryCode} ${restDigits.slice(0, 2)} ${restDigits.slice(2, 6)} ${restDigits.slice(6)}`;
      } else if (restDigits.length >= 9) {
        // Format as +44 XXX XXX XXX
        return `+${countryCode} ${restDigits.slice(0, 3)} ${restDigits.slice(3, 6)} ${restDigits.slice(6)}`;
      }
    }

    // For other international numbers, return with + and spaces every 3-4 digits
    return phone;
  }

  // If not recognized, return original
  return phone;
}

/**
 * Normalizes a phone number for storage (removes formatting)
 */
export function normalizePhoneNumber(phone: string): string {
  // Keep + for international numbers, otherwise just digits
  if (phone.trim().startsWith('+')) {
    return '+' + phone.replace(/\D/g, '');
  }
  return phone.replace(/\D/g, '');
}
