import { create } from 'zustand';

type View = 'list' | 'editor';

interface NavigationState {
  currentView: View;
  selectedNoteId: string | null;
  setView: (view: View, noteId?: string | null) => void;
  goBack: () => void;
}

let pageStore: any = null;

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'list',
  selectedNoteId: null,

  setView: (view, noteId = null) => {
    set({ currentView: view, selectedNoteId: noteId });
    if (view === 'editor' && noteId) {
      if (!pageStore) {
        pageStore = require('./pageStore').usePageStore;
      }
      pageStore.getState().setActivePage(noteId);
    }
  },

  goBack: () => {
    set({ currentView: 'list', selectedNoteId: null });
    if (!pageStore) {
      pageStore = require('./pageStore').usePageStore;
    }
    pageStore.getState().setActivePage(null);
  },
}));

