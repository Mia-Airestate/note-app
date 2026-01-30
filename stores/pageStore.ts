import { create } from 'zustand';
import { Page } from '@/types/page';
import { generateId } from '@/utils/id';
import { savePage, getAllPages, getPage, deletePage as deletePageFromDB } from '@/utils/storage';
import { migratePage } from '@/utils/migratePage';

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
  loadPageFromStorage: (id: string) => Promise<Page | null>;
  savePageToStorage: (page: Page) => Promise<void>;
  deletePageFromStorage: (id: string) => Promise<void>;
}

const createEmptyPage = (): Page => {
  const now = Date.now();

  return {
    id: generateId(),
    title: 'Untitled',
    markdown: '',
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
    console.log(`💾 [PageStore] Updating page ${id}:`, {
      updates,
      markdownLength: updates.markdown ? updates.markdown.length : 'N/A',
      markdownPreview: updates.markdown ? updates.markdown.substring(0, 100) : 'N/A',
    });
    
    set((state) => {
      const pageBeforeUpdate = state.pages.find((p) => p.id === id);
      console.log(`💾 [PageStore] Page before update:`, {
        id: pageBeforeUpdate?.id,
        title: pageBeforeUpdate?.title,
        markdownLength: pageBeforeUpdate ? (pageBeforeUpdate.markdown || '').length : 'N/A',
      });
      
      const updatedPages = state.pages.map((page) =>
        page.id === id
          ? { ...page, ...updates, updatedAt: Date.now() }
          : page
      );
      const updatedPage = updatedPages.find((p) => p.id === id);
      
      console.log(`💾 [PageStore] Page after update:`, {
        id: updatedPage?.id,
        title: updatedPage?.title,
        markdownLength: updatedPage ? (updatedPage.markdown || '').length : 'N/A',
        markdownPreview: updatedPage ? (updatedPage.markdown || '').substring(0, 100) : 'N/A',
      });
      
      // Save to storage asynchronously
      if (updatedPage) {
        console.log(`💾 [PageStore] Saving page ${id} to IndexedDB...`);
        savePage(updatedPage).then(() => {
          console.log(`💾 [PageStore] Successfully saved page ${id} to IndexedDB`);
        }).catch((error) => {
          console.error(`💾 [PageStore] Failed to save page ${id} to IndexedDB:`, error);
        });
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
      console.log('📦 [IndexedDB] Loaded pages from IndexedDB:', pages.length, 'pages');
      pages.forEach((page, index) => {
        console.log(`  [${index}] ID: ${page.id}, Title: "${page.title}", Markdown length: ${(page.markdown || '').length}, Updated: ${new Date(page.updatedAt).toISOString()}`);
      });
      
      // Migrate old pages to new structure
      const migratedPages = pages.map(migratePage);
      // Sort by updatedAt descending (newest first)
      migratedPages.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ pages: migratedPages });
      
      console.log('📦 [PageStore] Set pages in store:', migratedPages.length, 'pages');
      migratedPages.forEach((page, index) => {
        console.log(`  [${index}] ID: ${page.id}, Title: "${page.title}", Markdown length: ${(page.markdown || '').length}`);
      });
    } catch (error) {
      console.error('Failed to load pages from storage:', error);
    }
  },

  loadPageFromStorage: async (id: string) => {
    try {
      const state = get();
      // Check if page already exists in store
      const existingPage = state.pages.find((p) => p.id === id);
      if (existingPage) {
        console.log(`📦 [PageStore] Page ${id} already in store:`, {
          id: existingPage.id,
          title: existingPage.title,
          markdownLength: (existingPage.markdown || '').length,
        });
        return existingPage;
      }

      // Load from IndexedDB
      console.log(`📦 [IndexedDB] Loading page ${id} from IndexedDB...`);
      const page = await getPage(id);
      if (page) {
        console.log(`📦 [IndexedDB] Loaded page ${id}:`, {
          id: page.id,
          title: page.title,
          markdownLength: (page.markdown || '').length,
          markdownPreview: (page.markdown || '').substring(0, 100),
        });
        
        const migratedPage = migratePage(page);
        // Add to pages array if not already present
        const updatedPages = [...state.pages, migratedPage];
        // Sort by updatedAt descending
        updatedPages.sort((a, b) => b.updatedAt - a.updatedAt);
        set({ pages: updatedPages });
        
        console.log(`📦 [PageStore] Added page ${id} to store. Total pages:`, updatedPages.length);
        return migratedPage;
      }
      console.warn(`📦 [IndexedDB] Page ${id} not found in IndexedDB`);
      return null;
    } catch (error) {
      console.error('Failed to load page from storage:', error);
      return null;
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

