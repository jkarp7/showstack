/**
 * ShowStack Theme Constants
 *
 * Centralized design tokens for consistent styling across all modules.
 * These constants ensure visual consistency between Production, Prep, Manager, and future modules.
 */

export const COLORS = {
  // Background colors
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    hover: 'hover:bg-gray-600',
    active: 'bg-gray-600',
  },

  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    disabled: 'text-gray-500',
  },

  // Border colors
  border: {
    primary: 'border-gray-700',
    secondary: 'border-gray-600',
    focus: 'border-blue-500',
  },

  // Action colors
  action: {
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    secondary: 'bg-gray-700 hover:bg-gray-600',
  },
} as const;

export const SPACING = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const;

export const ROUNDED = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;

export const TRANSITIONS = {
  default: 'transition',
  all: 'transition-all',
  colors: 'transition-colors',
} as const;

/**
 * Common CSS class combinations for frequently used UI patterns
 */
export const UI_PATTERNS = {
  // Input fields
  input: `w-full px-3 py-2 ${COLORS.bg.tertiary} border ${COLORS.border.primary} ${ROUNDED.sm} ${COLORS.text.primary} focus:outline-none focus:${COLORS.border.focus}`,
  inputSmall: `w-full px-2 py-1 ${COLORS.bg.tertiary} border ${COLORS.border.primary} ${ROUNDED.sm} ${COLORS.text.primary} text-sm focus:outline-none focus:${COLORS.border.focus}`,

  // Buttons
  buttonPrimary: `px-4 py-2 ${COLORS.action.primary} ${ROUNDED.sm} font-medium ${TRANSITIONS.default}`,
  buttonSecondary: `px-4 py-2 ${COLORS.action.secondary} ${ROUNDED.sm} ${TRANSITIONS.default}`,
  buttonDanger: `px-4 py-2 ${COLORS.action.danger} ${ROUNDED.sm} font-medium ${TRANSITIONS.default}`,
  buttonSuccess: `px-4 py-2 ${COLORS.action.success} ${ROUNDED.sm} font-medium ${TRANSITIONS.default}`,

  // Cards
  card: `${COLORS.bg.secondary} ${ROUNDED.md} border ${COLORS.border.primary}`,
  cardHover: `${COLORS.bg.secondary} ${ROUNDED.md} border ${COLORS.border.primary} ${COLORS.bg.hover} ${TRANSITIONS.default} cursor-pointer`,

  // Labels
  label: `text-sm font-medium ${COLORS.text.secondary} mb-1`,
  labelSmall: `text-xs font-medium ${COLORS.text.secondary} mb-1`,

  // Sections
  section: `${COLORS.bg.secondary} border-b ${COLORS.border.primary}`,

  // Modals/Dialogs
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
  modalContent: `${COLORS.bg.secondary} ${ROUNDED.md} border ${COLORS.border.primary} w-full max-w-2xl`,

  // Headers
  pageHeader: `${COLORS.bg.secondary} border-b ${COLORS.border.primary} p-4`,
  sectionHeader: `text-xl font-bold ${COLORS.text.primary}`,
} as const;

/**
 * Module-specific color schemes
 * Each module can have its own accent color while maintaining consistent structure
 */
export const MODULE_COLORS = {
  production: {
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    accentText: 'text-blue-400',
  },
  prep: {
    accent: 'bg-purple-600',
    accentHover: 'hover:bg-purple-700',
    accentText: 'text-purple-400',
  },
  manager: {
    accent: 'bg-green-600',
    accentHover: 'hover:bg-green-700',
    accentText: 'text-green-400',
  },
} as const;
