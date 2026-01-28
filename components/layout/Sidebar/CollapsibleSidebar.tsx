'use client';

import { useEffect, useRef } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { groupPagesByDate } from '@/utils/dateGrouping';
import { NoteItem } from './NoteItem';
import './CollapsibleSidebar.css';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CollapsibleSidebar({ isCollapsed, onToggle }: CollapsibleSidebarProps) {
  const pages = usePageStore((state) => state.pages);
  const activePageId = usePageStore((state) => state.activePageId);
  const setView = useNavigationStore((state) => state.setView);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Swipe gesture for mobile
  useEffect(() => {
    if (!isMobile || !sidebarRef.current) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const swipeDistance = touchStartX - touchEndX;

      // Swipe right (left to right) - go back / close sidebar
      if (swipeDistance < -swipeThreshold && isCollapsed) {
        onToggle();
      }
      // Swipe left (right to left) - close sidebar
      else if (swipeDistance > swipeThreshold && !isCollapsed) {
        onToggle();
      }
    };

    const element = sidebarRef.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isCollapsed, onToggle]);

  const handleNoteClick = (noteId: string) => {
    setView('editor', noteId);
    if (isMobile) {
      onToggle(); // Close sidebar on mobile after navigation
    }
  };

  const groupedPages = groupPagesByDate(pages);

  return (
    <div 
      ref={sidebarRef}
      className={isCollapsed ? 'collapsible-sidebar collapsed' : 'collapsible-sidebar'}
    >
      {!isCollapsed && (
        <div className="sidebar-content">
          {pages.length === 0 ? (
            <div className="sidebar-empty">
              <p className="text-secondary">No notes yet</p>
            </div>
          ) : (
            <div className="sidebar-groups">
              {groupedPages.map((group) => (
                <div key={group.label} className="sidebar-group">
                  <h2 className="sidebar-group-title">{group.label}</h2>
                  <div className="sidebar-list">
                    {group.pages.map((page) => (
                      <NoteItem
                        key={page.id}
                        page={page}
                        isActive={page.id === activePageId}
                        onClick={() => handleNoteClick(page.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
