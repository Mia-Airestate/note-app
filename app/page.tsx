'use client';

import { useState } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { AppWindow } from '@/components/layout/AppWindow/AppWindow';
import { TopBar } from '@/components/layout/TopBar/TopBar';
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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="desktop-background">
      <div className="desktop-container">
        <AppWindow>
          <TopBar />
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
