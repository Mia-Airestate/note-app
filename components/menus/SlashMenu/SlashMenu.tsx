'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BlockType } from '@/types/block';
import { getSlashMenuItems, findMenuItemBySlashCommand } from '@/config/blockMenuConfig';
import { Icon } from '@/components/ui/Icon/Icon';
import './SlashMenu.css';

interface SlashMenuProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  searchQuery?: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashMenu({
  isOpen,
  position,
  searchQuery = '',
  onSelect,
  onClose,
}: SlashMenuProps) {
  const [search, setSearch] = useState(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get items from config
  const allItems = getSlashMenuItems();
  
  // Filter items by search query
  const filteredItems = allItems.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.slashCommands?.some((cmd) => cmd.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = useCallback(
    (type: BlockType) => {
      onSelect(type);
      onClose();
    },
    [onSelect, onClose]
  );

  // Handle keyboard navigation on the input field
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]?.blockType) {
            handleSelect(filteredItems[selectedIndex].blockType!);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredItems, selectedIndex, handleSelect, onClose]
  );

  // Handle Escape key on document level (to close menu even when input not focused)
  const handleDocumentKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  // Reset search when menu opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape key on document level
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleDocumentKeyDown);
      return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }
  }, [isOpen, handleDocumentKeyDown]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen || !position) return null;

  // Render icon (string or React component)
  const renderIcon = (icon: string | React.ComponentType<any>) => {
    if (typeof icon === 'string') {
      return <span className="slash-menu-icon-text">{icon}</span>;
    }
    const IconComponent = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <IconComponent size={18} className="slash-menu-icon" />;
  };

  return (
    <div
      ref={menuRef}
      className="slash-menu"
      style={{
        position: 'absolute',
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <div className="slash-menu-search">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search blocks..."
          className="slash-menu-input"
        />
      </div>
      <div className="slash-menu-list">
        {filteredItems.length === 0 ? (
          <div className="slash-menu-empty">No matching blocks</div>
        ) : (
          filteredItems.map((item, index) => (
            <button
              key={item.id}
              className={`slash-menu-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => {
                if (item.blockType) {
                  handleSelect(item.blockType);
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {renderIcon(item.icon)}
              <div className="slash-menu-content">
                <div className="slash-menu-label">{item.label}</div>
                {item.slashCommands && item.slashCommands.length > 0 && (
                  <div className="slash-menu-commands">
                    {item.slashCommands.join(', ')}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
