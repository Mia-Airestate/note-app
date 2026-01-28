'use client';

import { useState, useEffect } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiChevronLeft, FiChevronRight, FiList, FiPlus } from 'react-icons/fi';
import { NoteItem } from './NoteItem';
import './CollapsibleSidebar.css';

export function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pages = usePageStore((state) => state.pages);
  const activePageId = usePageStore((state) => state.activePageId);
  const createPage = usePageStore((state) => state.createPage);
  const setActivePage = usePageStore((state) => state.setActivePage);
  const setView = useNavigationStore((state) => state.setView);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleShowAll = () => {
    setView('list');
  };

  const handleNoteClick = (noteId: string) => {
    setView('editor', noteId);
  };

  const handleNewPage = () => {
    const newPage = createPage();
    setView('editor', newPage.id);
  };

  return (
    <div className={isCollapsed ? 'collapsible-sidebar collapsed' : 'collapsible-sidebar'}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <GlassButton
            icon={FiPlus}
            onClick={handleNewPage}
            ariaLabel="New note"
          />
        )}
        <GlassButton
          icon={isCollapsed ? FiChevronRight : FiChevronLeft}
          onClick={handleToggle}
          ariaLabel="Toggle sidebar"
        />
      </div>
      {!isCollapsed && (
        <>
          <div className="sidebar-content">
            <GlassButton
              icon={FiList}
              onClick={handleShowAll}
              ariaLabel="Show all notes"
            />
            {pages.length === 0 ? (
              <div className="sidebar-empty">
                <p className="text-secondary">No notes yet</p>
              </div>
            ) : (
              <div className="sidebar-list">
                {pages.map((page) => (
                  <NoteItem
                    key={page.id}
                    page={page}
                    isActive={page.id === activePageId}
                    onClick={() => handleNoteClick(page.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
