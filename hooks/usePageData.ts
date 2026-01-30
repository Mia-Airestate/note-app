'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { Page } from '@/types/page';
import { migratePage } from '@/utils/migratePage';

/**
 * Unified hook for reading page data from IndexedDB
 * Ensures data consistency across all components
 * 
 * @param pageId - Optional page ID to get a specific page. If not provided, returns all pages
 * @returns Object with page data, loading state, and error state
 */
export function usePageData(pageId?: string | null) {
  const pages = usePageStore((state) => state.pages);
  const loadPageFromStorage = usePageStore((state) => state.loadPageFromStorage);
  const loadPagesFromStorage = usePageStore((state) => state.loadPagesFromStorage);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load all pages from IndexedDB on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      loadPagesFromStorage()
        .then(() => {
          setIsInitialized(true);
          setIsLoading(false);
          console.log('🔄 [usePageData] Initialized - all pages loaded from IndexedDB');
        })
        .catch((err) => {
          console.error('🔄 [usePageData] Failed to load pages:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [isInitialized, loadPagesFromStorage]);

  // If pageId is provided, ensure that specific page is loaded
  useEffect(() => {
    if (pageId && isInitialized) {
      const pageInStore = pages.find((p) => p.id === pageId);
      if (!pageInStore) {
        console.log(`🔄 [usePageData] Page ${pageId} not in store, loading from IndexedDB...`);
        setIsLoading(true);
        loadPageFromStorage(pageId)
          .then((page) => {
            if (page) {
              console.log(`🔄 [usePageData] Successfully loaded page ${pageId} from IndexedDB`);
            } else {
              console.warn(`🔄 [usePageData] Page ${pageId} not found in IndexedDB`);
            }
            setIsLoading(false);
          })
          .catch((err) => {
            console.error(`🔄 [usePageData] Failed to load page ${pageId}:`, err);
            setError(err);
            setIsLoading(false);
          });
      }
    }
  }, [pageId, isInitialized, pages, loadPageFromStorage]);

  // Get the requested page(s)
  const pageData = useMemo(() => {
    if (pageId) {
      // Return single page
      const page = pages.find((p) => p.id === pageId);
      if (!page) {
        return null;
      }
      const migrated = migratePage(page);
      console.log(`🔄 [usePageData] Returning page ${pageId}:`, {
        id: migrated.id,
        title: migrated.title,
        markdownLength: (migrated.markdown || '').length,
        source: 'store',
      });
      return migrated;
    } else {
      // Return all pages
      const migratedPages = pages.map(migratePage);
      console.log(`🔄 [usePageData] Returning all pages:`, {
        count: migratedPages.length,
        pages: migratedPages.map(p => ({
          id: p.id,
          title: p.title,
          markdownLength: (p.markdown || '').length,
        })),
        source: 'store',
      });
      return migratedPages;
    }
  }, [pageId, pages]);

  return {
    page: pageId ? (pageData as Page | null) : null,
    pages: !pageId ? (pageData as Page[]) : null,
    isLoading,
    error,
    isInitialized,
  };
}

