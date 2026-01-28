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

  // Get title from first line of editor (first block content)
  useEffect(() => {
    if (blocks.length > 0 && blocks[0].content) {
      const firstLine = blocks[0].content.trim();
      setTitle(firstLine || 'Untitled');
    } else if (activePage) {
      setTitle('Untitled');
    } else {
      setTitle('');
    }
  }, [blocks, activePage?.id]);

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
      // Update the first block content
      if (blocks.length > 0) {
        updatePage(selectedNoteId, {
          title: newTitle,
          blocks: blocks.map((block, index) =>
            index === 0 ? { ...block, content: newTitle } : block
          ),
        });
      } else {
        // No blocks yet, create a paragraph block with the title
        const paragraphBlock = {
          id: `paragraph-${Date.now()}`,
          type: 'paragraph' as const,
          content: newTitle,
        };
        updatePage(selectedNoteId, {
          title: newTitle,
          blocks: [paragraphBlock],
        });
      }
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

  const saveCurrentNote = () => {
    if (activePage && selectedNoteId && blocks.length > 0) {
      updatePage(selectedNoteId, { blocks });
    }
  };

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
