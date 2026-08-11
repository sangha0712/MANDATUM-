import { create } from 'zustand';

interface AppState {
  isStarted: boolean;
  setStarted: (started: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isStarted: false,
  setStarted: (started) => set({ isStarted: started }),
}));
