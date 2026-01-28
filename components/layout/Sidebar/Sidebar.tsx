'use client';

import { usePageStore } from '@/stores/pageStore';
import { Button } from '@/components/ui/Button/Button';
import { NoteItem } from './NoteItem';
import { ThemeToggle } from './ThemeToggle';
import './Sidebar.css';

export function Sidebar() {
  const pages = usePageStore((state) => state.pages);
  const activePageId = usePageStore((state) => state.activePageId);
  const createPage = usePageStore((state) => state.createPage);
  const setActivePage = usePageStore((state) => state.setActivePage);

  const handleNewPage = () => {
    createPage();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Notes</h1>
        <Button onClick={handleNewPage} size="sm">
          + New Note
        </Button>
      </div>
      <div className="sidebar-content">
        {pages.length === 0 ? (
          <div className="sidebar-empty">
            <p className="text-secondary">No notes yet</p>
            <Button onClick={handleNewPage} variant="secondary" size="sm">
              Create your first note
            </Button>
          </div>
        ) : (
          <div className="sidebar-list">
            {pages.map((page) => (
              <NoteItem
                key={page.id}
                page={page}
                isActive={page.id === activePageId}
                onClick={() => setActivePage(page.id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="sidebar-footer">
        <ThemeToggle />
      </div>
    </div>
  );
}

