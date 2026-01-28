import { create } from 'zustand';
import { Page } from '@/types/page';
import { generateId } from '@/utils/id';
import { Block } from '@/types/block';

interface PageState {
  pages: Page[];
  activePageId: string | null;
  setPages: (pages: Page[]) => void;
  setActivePage: (id: string | null) => void;
  createPage: () => Page;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  getActivePage: () => Page | null;
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
    return newPage;
  },

  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === id
          ? { ...page, ...updates, updatedAt: Date.now() }
          : page
      ),
    })),

  deletePage: (id) =>
    set((state) => {
      const filtered = state.pages.filter((page) => page.id !== id);
      const newActiveId =
        state.activePageId === id
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.activePageId;
      return { pages: filtered, activePageId: newActiveId };
    }),

  getActivePage: () => {
    const state = get();
    return (
      state.pages.find((page) => page.id === state.activePageId) || null
    );
  },
}));

