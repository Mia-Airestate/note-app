import { create } from 'zustand';
import { Page } from '@/types/page';
import { generateId } from '@/utils/id';
import { Block } from '@/types/block';
import { savePage, getAllPages, deletePage as deletePageFromDB } from '@/utils/storage';

interface PageState {
  pages: Page[];
  activePageId: string | null;
  setPages: (pages: Page[]) => void;
  setActivePage: (id: string | null) => void;
  createPage: () => Page;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  getActivePage: () => Page | null;
  loadPagesFromStorage: () => Promise<void>;
  savePageToStorage: (page: Page) => Promise<void>;
  deletePageFromStorage: (id: string) => Promise<void>;
}

const createEmptyPage = (): Page => {
  const now = Date.now();
  const emptyBlock: Block = {
    id: generateId(),
    type: 'paragraph',
    content: '',
  };

  return {
    id: generateId(),
    title: 'Untitled',
    blocks: [emptyBlock],
    createdAt: now,
    updatedAt: now,
  };
};

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  activePageId: null,

  setPages: (pages) => set({ pages }),

  setActivePage: (id) => set({ activePageId: id }),

  createPage: () => {
    const newPage = createEmptyPage();
    set((state) => ({
      pages: [newPage, ...state.pages],
      activePageId: newPage.id,
    }));
    // Save to storage asynchronously
    savePage(newPage).catch(console.error);
    return newPage;
  },

  updatePage: (id, updates) => {
    set((state) => {
      const updatedPages = state.pages.map((page) =>
        page.id === id
          ? { ...page, ...updates, updatedAt: Date.now() }
          : page
      );
      const updatedPage = updatedPages.find((p) => p.id === id);
      // Save to storage asynchronously
      if (updatedPage) {
        savePage(updatedPage).catch(console.error);
      }
      return { pages: updatedPages };
    });
  },

  deletePage: (id) => {
    set((state) => {
      const filtered = state.pages.filter((page) => page.id !== id);
      const newActiveId =
        state.activePageId === id
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.activePageId;
      // Delete from storage asynchronously
      deletePageFromDB(id).catch(console.error);
      return { pages: filtered, activePageId: newActiveId };
    });
  },

  loadPagesFromStorage: async () => {
    try {
      const pages = await getAllPages();
      // Sort by updatedAt descending (newest first)
      pages.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ pages });
    } catch (error) {
      console.error('Failed to load pages from storage:', error);
    }
  },

  savePageToStorage: async (page: Page) => {
    try {
      await savePage(page);
    } catch (error) {
      console.error('Failed to save page to storage:', error);
    }
  },

  deletePageFromStorage: async (id: string) => {
    try {
      await deletePageFromDB(id);
    } catch (error) {
      console.error('Failed to delete page from storage:', error);
    }
  },

  getActivePage: () => {
    const state = get();
    return (
      state.pages.find((page) => page.id === state.activePageId) || null
    );
  },
}));

