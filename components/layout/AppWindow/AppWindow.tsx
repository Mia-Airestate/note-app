'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { CollapsibleSidebar } from '@/components/layout/Sidebar/CollapsibleSidebar';
import { Icon } from '@/components/ui/Icon/Icon';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiFileText, FiSettings, FiSidebar, FiChevronLeft, FiTrash2, FiMoreHorizontal, FiCheck } from 'react-icons/fi';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import './AppWindow.css';

interface AppWindowProps {
  children: ReactNode;
  title?: string;
  searchQuery?: string;
}

export function AppWindow({ children, title = 'Life note', searchQuery = '' }: AppWindowProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const currentView = useNavigationStore((state) => state.currentView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const goBack = useNavigationStore((state) => state.goBack);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const deletePage = usePageStore((state) => state.deletePage);
  const blocks = useEditorStore((state) => state.blocks);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const activePage = selectedNoteId && currentView === 'editor' ? getActivePage() : null;
  const isFileOpen = currentView === 'editor' && selectedNoteId && activePage;

  // Get page title for header (view only)
  const getPageTitle = () => {
    if (activePage) {
      return activePage.title || 'Untitled';
    }
    return 'New Page';
  };

  const saveCurrentNote = () => {
    if (activePage && selectedNoteId && blocks.length > 0) {
      updatePage(selectedNoteId, { blocks });
    }
  };

  const handleBack = () => {
    saveCurrentNote();
    goBack();
  };

  const handleDelete = () => {
    if (activePage && selectedNoteId) {
      if (confirm('Are you sure you want to delete this note?')) {
        deletePage(selectedNoteId);
        goBack();
      }
    }
  };

  const handleMore = () => {
    // TODO: Implement more options menu
    console.log('More options');
  };

  const handleDone = () => {
    saveCurrentNote();
    goBack();
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        // On desktop, sidebar is open by default
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Swipe gesture for main content on mobile
  useEffect(() => {
    if (!isMobile || !mainContentRef.current) return;

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

      // Swipe right (left to right) - go back
      if (swipeDistance < -swipeThreshold) {
        if (currentView === 'editor' && selectedNoteId) {
          goBack();
        } else if (currentView === 'list' && isSidebarCollapsed) {
          setIsSidebarCollapsed(false);
        }
      }
    };

    const element = mainContentRef.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, currentView, selectedNoteId, goBack, isSidebarCollapsed]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-window">
      <div className="app-window-header">
        <div className="app-window-header-left">
          <div className="app-window-controls">
            <button className="window-control window-control-close" />
            <button className="window-control window-control-minimize" />
            <button className="window-control window-control-maximize" />
          </div>
          {!isMobile && (
            <>
              <GlassButton 
                icon={FiSidebar} 
                variant="unstyled"
                ariaLabel="Toggle sidebar" 
                onClick={handleToggleSidebar}
              />
              {isFileOpen && (
                <GlassButton 
                  icon={FiChevronLeft}
                  variant="unstyled"
                  ariaLabel="Back" 
                  onClick={handleBack}
                />
              )}
            </>
          )}
        </div>
        <div className="app-window-title">
          <Icon icon={FiFileText} size={14} className="app-window-icon" />
          <span>{getPageTitle()}</span>
        </div>
        <div className="app-window-actions">
          {isFileOpen && (
            <>
              <GlassButton
                icon={FiTrash2}
                onClick={handleDelete}
                variant="unstyled"
                ariaLabel="Delete"
              />
              <GlassButton
                icon={FiCheck}
                onClick={handleDone}
                variant="unstyled"
                ariaLabel="Done"
              />
            </>
          )}
          {/* <GlassButton icon={FiSettings} variant="unstyled" ariaLabel="Settings" /> */}
        </div>
      </div>
      <div className="app-window-content">
        <CollapsibleSidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
          searchQuery={searchQuery}
        />
        <div ref={mainContentRef} className="app-window-main">{children}</div>
      </div>
    </div>
  );
}

