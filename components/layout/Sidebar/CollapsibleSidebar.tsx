'use client';

import { useEffect, useRef } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useEditorStore } from '@/stores/editorStore';
import { groupPagesByDate } from '@/utils/dateGrouping';
import { highlightText } from '@/utils/highlightText';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { HiOutlinePencil } from 'react-icons/hi';
import { NoteItem } from './NoteItem';
import './CollapsibleSidebar.css';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  searchQuery?: string;
}

export function CollapsibleSidebar({ isCollapsed, onToggle, searchQuery = '' }: CollapsibleSidebarProps) {
  const pages = usePageStore((state) => state.pages);
  const activePageId = usePageStore((state) => state.activePageId);
  const updatePage = usePageStore((state) => state.updatePage);
  const deletePage = usePageStore((state) => state.deletePage);
  const createPage = usePageStore((state) => state.createPage);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const setView = useNavigationStore((state) => state.setView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const goBack = useNavigationStore((state) => state.goBack);
  const blocks = useEditorStore((state) => state.blocks);
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
    // Save current note before switching
    const currentPage = getActivePage();
    if (currentPage && currentPage.id !== noteId && blocks.length > 0) {
      updatePage(currentPage.id, { blocks });
    }
    
    setView('editor', noteId);
    if (isMobile) {
      onToggle(); // Close sidebar on mobile after navigation
    }
  };

  const handleDelete = (id: string) => {
    // Check if the deleted page is currently active/selected
    const isActivePage = activePageId === id || selectedNoteId === id;
    
    deletePage(id);
    
    // If the deleted page was active, navigate back to list view
    if (isActivePage) {
      goBack();
    }
  };

  const handleNewPage = () => {
    const newPage = createPage();
    setView('editor', newPage.id);
  };

  // Filter and sort pages based on search query
  const filteredPages = searchQuery
    ? pages
        .filter((page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.blocks.some((block) =>
            block.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
        .sort((a, b) => {
          // Sort by relevance: exact title matches first, then by updatedAt
          const aTitleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
          const bTitleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          return b.updatedAt - a.updatedAt;
        })
    : pages;

  const groupedPages = searchQuery
    ? filteredPages.length > 0
      ? [{ label: `"${searchQuery}"`, pages: filteredPages }]
      : []
    : groupPagesByDate(filteredPages);

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
                  <div className="sidebar-group-header">
                    <p className="sidebar-group-title">
                      {searchQuery ? highlightText(group.label, searchQuery) : group.label}
                    </p>
                    <GlassButton
                      icon={HiOutlinePencil}
                      variant="primary"
                      onClick={handleNewPage}
                      ariaLabel="New note"
                    />
                  </div>
                  <div className="sidebar-list">
                    {group.pages.map((page) => (
                      <NoteItem
                        key={page.id}
                        page={page}
                        isActive={page.id === activePageId}
                        onClick={() => handleNoteClick(page.id)}
                        onDelete={handleDelete}
                        searchQuery={searchQuery}
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
