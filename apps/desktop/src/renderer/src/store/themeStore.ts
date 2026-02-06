import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type UIDensity = 'comfortable' | 'compact';

export interface ThemeState {
  // Theme settings
  mode: ThemeMode;
  accentColor: AccentColor;
  uiDensity: UIDensity;
  fontScale: number; // 75-125

  // Computed theme (used by components)
  effectiveTheme: 'light' | 'dark';

  // Actions
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setUIDensity: (density: UIDensity) => void;
  setFontScale: (scale: number) => void;
  updateEffectiveTheme: () => void;
}

// Helper to detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'dark',
      accentColor: 'blue',
      uiDensity: 'comfortable',
      fontScale: 100,
      effectiveTheme: 'dark',

      // Actions
      setMode: (mode) => {
        set({ mode });
        get().updateEffectiveTheme();
      },

      setAccentColor: (color) => set({ accentColor: color }),

      setUIDensity: (density) => set({ uiDensity: density }),

      setFontScale: (scale) => set({ fontScale: Math.max(75, Math.min(125, scale)) }),

      updateEffectiveTheme: () => {
        const { mode } = get();
        const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
        set({ effectiveTheme });
      },
    }),
    {
      name: 'showstack-theme',
    },
  ),
);

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.mode === 'system') {
      store.updateEffectiveTheme();
    }
  });
}

// Accent color palettes
export const accentColors: Record<
  AccentColor,
  { primary: string; hover: string; light: string; dark: string }
> = {
  blue: {
    primary: '#3B82F6',
    hover: '#2563EB',
    light: '#DBEAFE',
    dark: '#1E40AF',
  },
  purple: {
    primary: '#A855F7',
    hover: '#9333EA',
    light: '#F3E8FF',
    dark: '#7C3AED',
  },
  green: {
    primary: '#10B981',
    hover: '#059669',
    light: '#D1FAE5',
    dark: '#047857',
  },
  orange: {
    primary: '#F97316',
    hover: '#EA580C',
    light: '#FFEDD5',
    dark: '#C2410C',
  },
  red: {
    primary: '#EF4444',
    hover: '#DC2626',
    light: '#FEE2E2',
    dark: '#B91C1C',
  },
};
