'use client';

import { useState, useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { Icon } from '@/components/ui/Icon/Icon';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import {
  FiSearch,
  FiMic,
  FiBold,
  FiItalic,
  FiUnderline,
  FiLink,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { TbStrikethrough } from 'react-icons/tb';
import { HiOutlinePencil } from 'react-icons/hi';
import { MdHighlight } from 'react-icons/md';
import './BottomToolbar.css';

interface BottomToolbarProps {
  onSearchChange?: (query: string) => void;
}

export function BottomToolbar({ onSearchChange }: BottomToolbarProps) {
  const currentView = useNavigationStore((state) => state.currentView);
  const setView = useNavigationStore((state) => state.setView);
  const createPage = usePageStore((state) => state.createPage);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onSearchChange?.(searchQuery);
  }, [searchQuery, onSearchChange]);

  const handleNewNote = () => {
    const newPage = createPage();
    setView('editor', newPage.id);
  };

  const handleMic = () => {
    // TODO: Implement voice input
    console.log('Voice input');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  if (currentView === 'list') {
    return (
      <div className="bottom-toolbar bottom-toolbar-list">
        <div className="toolbar-search-wrapper">
          <Icon icon={FiSearch} size={18} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <GlassButton icon={FiMic} onClick={handleMic} ariaLabel="Voice input" />
        <GlassButton
          icon={HiOutlinePencil}
          variant="primary"
          onClick={handleNewNote}
          ariaLabel="New note"
        />
      </div>
    );
  }

  return (
    <div className="bottom-toolbar bottom-toolbar-editor">
      <GlassButton icon={FiBold} variant="active" ariaLabel="Bold" />
      <GlassButton icon={FiItalic} variant="unstyled" ariaLabel="Italic" />
      <GlassButton icon={FiUnderline} variant="unstyled" ariaLabel="Underline" />
      <GlassButton icon={TbStrikethrough} variant="unstyled" ariaLabel="Strikethrough" />
      <GlassButton icon={MdHighlight} variant="unstyled" ariaLabel="Highlight" />
      <GlassButton icon={FiLink} variant="unstyled" ariaLabel="Link" />
      <GlassButton icon={FiMoreHorizontal} variant="unstyled" ariaLabel="More options" />
    </div>
  );
}
