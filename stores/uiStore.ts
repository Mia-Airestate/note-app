import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  slashMenuOpen: boolean;
  setSlashMenuOpen: (open: boolean) => void;
  slashMenuPosition: { x: number; y: number } | null;
  setSlashMenuPosition: (position: { x: number; y: number } | null) => void;
  modalOpen: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      return { theme: newTheme };
    }),
  slashMenuOpen: false,
  setSlashMenuOpen: (open) => set({ slashMenuOpen: open }),
  slashMenuPosition: null,
  setSlashMenuPosition: (position) => set({ slashMenuPosition: position }),
  modalOpen: false,
  modalContent: null,
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
}));

