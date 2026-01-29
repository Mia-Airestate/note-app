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
  const modalOpen = useUIStore((state) => state.modalOpen);
  const modalContent = useUIStore((state) => state.modalContent);
  const closeModal = useUIStore((state) => state.closeModal);
  const loadPagesFromStorage = usePageStore((state) => state.loadPagesFromStorage);
  const [searchQuery, setSearchQuery] = useState('');

  // Register global keyboard shortcuts
  useGlobalShortcuts();

  useEffect(() => {
    // Load pages from IndexedDB on mount
    loadPagesFromStorage();
  }, [loadPagesFromStorage]);

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
