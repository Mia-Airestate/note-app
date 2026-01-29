import { useState, useCallback } from 'react';
import { BlockType } from '@/types/block';

export function useSlashMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const openMenu = useCallback((pos: { top: number; left: number }) => {
    setPosition(pos);
    setIsOpen(true);
    setSearchQuery('');
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
    setSearchQuery('');
  }, []);

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    isOpen,
    position,
    searchQuery,
    openMenu,
    closeMenu,
    updateSearch,
  };
}

