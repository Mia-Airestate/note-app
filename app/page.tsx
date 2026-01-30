'use client';

import { useState, useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { AppWindow } from '@/components/layout/AppWindow/AppWindow';
import { ListView } from '@/components/views/ListView/ListView';
import { EditorView } from '@/components/views/EditorView/EditorView';
import { BottomToolbar } from '@/components/layout/BottomToolbar/BottomToolbar';
import { Modal } from '@/components/ui/Modal/Modal';
import { useUIStore } from '@/stores/uiStore';
import './page.css';

export default function Home() {
  const currentView = useNavigationStore((state) => state.currentView);
  const syncWithURL = useNavigationStore((state) => state.syncWithURL);
  const setView = useNavigationStore((state) => state.setView);
  const modalOpen = useUIStore((state) => state.modalOpen);
  const modalContent = useUIStore((state) => state.modalContent);
  const closeModal = useUIStore((state) => state.closeModal);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Register global keyboard shortcuts
  useGlobalShortcuts();

  const setActivePage = usePageStore((state) => state.setActivePage);

  useEffect(() => {
    // Check for note query parameter in URL on mount
    // The usePageData hook will handle loading pages from IndexedDB
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const noteId = params.get('note');
      
      if (noteId) {
        // Set active page and open editor - usePageData hook will ensure page is loaded
        setActivePage(noteId);
        // Use requestAnimationFrame to ensure React state updates are processed
        requestAnimationFrame(() => {
          // Open editor view with this note
          setView('editor', noteId);
        });
      } else {
        // Sync with URL (in case URL was manually changed)
        syncWithURL();
      }
    }
    
    setIsInitialized(true);
  }, [setView, syncWithURL, setActivePage]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const noteId = params.get('note');
      
      if (noteId) {
        // Set active page and open editor - usePageData hook will ensure page is loaded
        setActivePage(noteId);
        requestAnimationFrame(() => {
          setView('editor', noteId);
        });
      } else {
        // No note in URL, go back to list
        syncWithURL();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setView, syncWithURL, setActivePage]);

  return (
    <div className="desktop-background">
      <div className="desktop-container">
        <AppWindow searchQuery={searchQuery}>
          {currentView === 'list' ? (
            <ListView searchQuery={searchQuery} />
          ) : (
            <EditorView />
          )}
          <BottomToolbar onSearchChange={setSearchQuery} />
        </AppWindow>
      </div>
      <Modal isOpen={modalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
}
