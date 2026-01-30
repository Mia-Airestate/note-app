import { create } from 'zustand';

type View = 'list' | 'editor';

interface NavigationState {
  currentView: View;
  selectedNoteId: string | null;
  setView: (view: View, noteId?: string | null) => void;
  goBack: () => void;
  syncWithURL: () => void;
  updateURL: (noteId: string | null, replace?: boolean) => void;
}

let pageStore: any = null;

// Helper function to update URL without page reload
function updateURLQueryParam(noteId: string | null, replace: boolean = false) {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const currentNoteId = url.searchParams.get('note');
  
  // Skip if URL already matches
  if ((noteId === null && !currentNoteId) || (noteId === currentNoteId)) {
    return;
  }
  
  if (noteId) {
    url.searchParams.set('note', noteId);
  } else {
    url.searchParams.delete('note');
  }
  
  // Use replaceState for initial sync, pushState for user navigation
  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
}

// Helper function to read note ID from URL
function getNoteIdFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('note');
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'list',
  selectedNoteId: null,

  setView: (view, noteId = null) => {
    set({ currentView: view, selectedNoteId: noteId });
    if (view === 'editor' && noteId) {
      if (!pageStore) {
        pageStore = require('./pageStore').usePageStore;
      }
      pageStore.getState().setActivePage(noteId);
      // Update URL with pushState (allows back button)
      get().updateURL(noteId, false);
    } else {
      // Clear URL when going back to list (use replaceState to avoid history entry)
      get().updateURL(null, true);
    }
  },

  goBack: () => {
    set({ currentView: 'list', selectedNoteId: null });
    if (!pageStore) {
      pageStore = require('./pageStore').usePageStore;
    }
    pageStore.getState().setActivePage(null);
    // Clear URL (use replaceState since this is programmatic navigation)
    get().updateURL(null, true);
  },

  syncWithURL: () => {
    const noteId = getNoteIdFromURL();
    if (noteId) {
      set({ currentView: 'editor', selectedNoteId: noteId });
      if (!pageStore) {
        pageStore = require('./pageStore').usePageStore;
      }
      pageStore.getState().setActivePage(noteId);
    }
  },

  updateURL: (noteId, replace = false) => {
    updateURLQueryParam(noteId, replace);
  },
}));

