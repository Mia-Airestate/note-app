'use client';

import { useState, useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { toggleFormat } from '@/utils/formatText';
import { Icon } from '@/components/ui/Icon/Icon';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import {
  FiSearch,
  FiMic,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { HiOutlinePencil } from 'react-icons/hi';
import {
  getBottomBarBlockItems,
  getBottomBarFormatItems,
  blockMenuItems,
} from '@/config/blockMenuConfig';
import './BottomToolbar.css';

interface BottomToolbarProps {
  onSearchChange?: (query: string) => void;
}

export function BottomToolbar({ onSearchChange }: BottomToolbarProps) {
  const currentView = useNavigationStore((state) => state.currentView);
  const setView = useNavigationStore((state) => state.setView);
  const createPage = usePageStore((state) => state.createPage);
  const selection = useEditorStore((state) => state.selection);
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const { addBlock, updateBlock, getBlock } = useBlockEditor();
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

  const handleBlockSelect = (blockType: string) => {
    if (focusedBlockId) {
      addBlock(blockType as any, focusedBlockId);
    } else {
      const blocks = useEditorStore.getState().blocks;
      const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1].id : undefined;
      addBlock(blockType as any, lastBlockId);
    }
  };

  const handleFormatSelect = (formatId: string) => {
    if (!focusedBlockId) return;

    const block = getBlock(focusedBlockId);
    if (!block) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    // Find the editable content element
    const contentElement = document.querySelector(
      `[data-block-id="${focusedBlockId}"] .editable-block-content`
    ) as HTMLElement;
    if (!contentElement) return;

    // Calculate positions relative to block content
    const preRange = range.cloneRange();
    preRange.selectNodeContents(contentElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;

    const formatType = formatId as 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight';
    
    // Preserve selection range before focusing
    const savedRange = range.cloneRange();
    
    // Focus the element first
    if (document.activeElement !== contentElement) {
      contentElement.focus();
    }
    
    // Restore selection after focus (synchronously)
    selection.removeAllRanges();
    selection.addRange(savedRange);
    
    // Apply visual formatting using browser commands first
    if (formatType === 'bold') {
      const success = document.execCommand('bold', false, undefined);
      // If execCommand failed, try manual approach
      if (!success) {
        try {
          const strong = document.createElement('strong');
          savedRange.surroundContents(strong);
        } catch (error) {
          // If surroundContents fails, try wrapping selected text
          const selectedText = savedRange.toString();
          if (selectedText) {
            savedRange.deleteContents();
            const strong = document.createElement('strong');
            strong.textContent = selectedText;
            savedRange.insertNode(strong);
          }
        }
      }
    } else if (formatType === 'italic') {
      document.execCommand('italic', false, undefined);
    } else if (formatType === 'underline') {
      document.execCommand('underline', false, undefined);
    } else if (formatType === 'code') {
      // Wrap in code element
      try {
        const codeElement = document.createElement('code');
        codeElement.style.background = 'rgba(0, 0, 0, 0.05)';
        codeElement.style.padding = '2px 4px';
        codeElement.style.borderRadius = '3px';
        codeElement.style.fontFamily = 'monospace';
        codeElement.style.fontSize = '0.9em';
        savedRange.surroundContents(codeElement);
      } catch (error) {
        // Fallback
        document.execCommand('formatBlock', false, 'code');
      }
    }
    
    // Extract formats from DOM after browser command
    setTimeout(() => {
      const { extractFormatsFromDOM } = require('@/utils/extractFormatsFromDOM');
      const extractedFormats = extractFormatsFromDOM(contentElement);
      const newContent = contentElement.textContent || '';
      updateBlock(focusedBlockId, { content: newContent, formats: extractedFormats });
    }, 10);
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

  // Determine which items to show based on selection state
  const showBlockItems = selection?.type !== 'text';
  const showFormatItems = selection?.type === 'text';

  const blockItems = showBlockItems ? getBottomBarBlockItems() : [];
  const formatItems = showFormatItems ? getBottomBarFormatItems(selection) : [];

  return (
    <div className="bottom-toolbar bottom-toolbar-editor">
      {showBlockItems &&
        blockItems.map((item) => (
          <GlassButton
            key={item.id}
            icon={item.icon}
            variant="unstyled"
            ariaLabel={item.label}
            onClick={() => {
              if (item.blockType) {
                handleBlockSelect(item.blockType);
              }
            }}
          />
        ))}
      {showFormatItems &&
        formatItems.map((item) => (
          <GlassButton
            key={item.id}
            icon={item.icon}
            variant={item.id === 'bold' ? 'active' : 'unstyled'}
            ariaLabel={item.label}
            onClick={() => handleFormatSelect(item.id)}
          />
        ))}
      <GlassButton
        icon={FiMoreHorizontal}
        variant="unstyled"
        ariaLabel="More options"
      />
    </div>
  );
}
