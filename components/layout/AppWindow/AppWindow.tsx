'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { CollapsibleSidebar } from '@/components/layout/Sidebar/CollapsibleSidebar';
import { Icon } from '@/components/ui/Icon/Icon';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiFileText, FiSettings, FiSidebar } from 'react-icons/fi';
import { useNavigationStore } from '@/stores/navigationStore';
import './AppWindow.css';

interface AppWindowProps {
  children: ReactNode;
  title?: string;
}

export function AppWindow({ children, title = 'Life note' }: AppWindowProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const currentView = useNavigationStore((state) => state.currentView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const goBack = useNavigationStore((state) => state.goBack);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
        <div className="app-window-controls">
          <button className="window-control window-control-close" />
          <button className="window-control window-control-minimize" />
          <button className="window-control window-control-maximize" />

        </div>
        {!isMobile && (
            <GlassButton 
              icon={FiSidebar} 
              ariaLabel="Toggle sidebar" 
              onClick={handleToggleSidebar}
            />
          )}
        <div className="app-window-title">
          <Icon icon={FiFileText} size={14} className="app-window-icon" />
          <span>{title}</span>
        </div>
        <div className="app-window-actions">
          <GlassButton icon={FiSettings} ariaLabel="Settings" />
        </div>
      </div>
      <div className="app-window-content">
        <CollapsibleSidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <div ref={mainContentRef} className="app-window-main">{children}</div>
      </div>
    </div>
  );
}

