import { useEffect, ReactNode } from 'react';
import { useThemeStore, accentColors } from '../store/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { effectiveTheme, accentColor, fontScale, uiDensity, updateEffectiveTheme } =
    useThemeStore();

  useEffect(() => {
    // Update effective theme on mount
    updateEffectiveTheme();
  }, [updateEffectiveTheme]);

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    // Apply accent color CSS variables
    const colors = accentColors[accentColor];
    root.style.setProperty('--color-accent-primary', colors.primary);
    root.style.setProperty('--color-accent-hover', colors.hover);
    root.style.setProperty('--color-accent-light', colors.light);
    root.style.setProperty('--color-accent-dark', colors.dark);

    // Apply font scale
    root.style.setProperty('--font-scale', `${fontScale / 100}`);

    // Apply UI density
    root.style.setProperty('--ui-density', uiDensity === 'comfortable' ? '1' : '0.8');
  }, [effectiveTheme, accentColor, fontScale, uiDensity]);

  return <>{children}</>;
}
