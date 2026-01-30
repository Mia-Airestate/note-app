'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Block } from '@/types/block';

export type SelectionMode = 'caret' | 'block';

interface BlockSelectionContextType {
  selectedBlockId: string | null;
  selectionMode: SelectionMode;
  setSelectedBlock: (blockId: string | null, mode: SelectionMode) => void;
  isTextBlock: (block: Block) => boolean;
}

const BlockSelectionContext = createContext<BlockSelectionContextType | undefined>(undefined);

export const useBlockSelection = () => {
  const context = useContext(BlockSelectionContext);
  if (!context) {
    throw new Error('useBlockSelection must be used within BlockSelectionProvider');
  }
  return context;
};

interface BlockSelectionProviderProps {
  children: ReactNode;
}

export const BlockSelectionProvider: React.FC<BlockSelectionProviderProps> = ({ children }) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('caret');

  const setSelectedBlock = useCallback((blockId: string | null, mode: SelectionMode) => {
    setSelectedBlockId(blockId);
    setSelectionMode(mode);
  }, []);

  const isTextBlock = useCallback((block: Block): boolean => {
    const textTypes: Block['type'][] = [
      'paragraph',
      'heading',
      'list',
      'quote',
      'code',
    ];
    return textTypes.includes(block.type);
  }, []);

  return (
    <BlockSelectionContext.Provider
      value={{
        selectedBlockId,
        selectionMode,
        setSelectedBlock,
        isTextBlock,
      }}
    >
      {children}
    </BlockSelectionContext.Provider>
  );
};

