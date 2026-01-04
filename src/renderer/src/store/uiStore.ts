import { create } from 'zustand';

interface UIState {
  isSettingsDialogOpen: boolean;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsDialogOpen: false,
  openSettingsDialog: () => set({ isSettingsDialogOpen: true }),
  closeSettingsDialog: () => set({ isSettingsDialogOpen: false }),
}));
