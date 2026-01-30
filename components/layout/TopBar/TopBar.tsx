'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import './TopBar.css';

export function TopBar() {
  const currentView = useNavigationStore((state) => state.currentView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);
  const [title, setTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activePage =
    selectedNoteId && currentView === 'editor' ? getActivePage() : null;

  // Get title from page
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title || 'Untitled');
    } else {
      setTitle('');
    }
  }, [activePage?.id, activePage?.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (activePage && selectedNoteId) {
      const newTitle = title.trim() || 'Untitled';
      // Just update the title - markdown will be synced automatically in EditorView
      updatePage(selectedNoteId, {
        title: newTitle,
      });
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Reset to first block content
      if (blocks.length > 0 && blocks[0].content) {
        setTitle(blocks[0].content.trim() || 'Untitled');
      } else {
        setTitle('Untitled');
      }
      setIsEditing(false);
    }
  };

  // Saving is now handled automatically in EditorView

  if (currentView === 'list') {
    return null;
  }

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {activePage && (
          <div className="top-bar-title">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                className="top-bar-title-input"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
              />
            ) : (
              <span onClick={() => setIsEditing(true)}>{title}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
