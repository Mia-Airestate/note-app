'use client';

import { useState, useCallback } from 'react';
import { Block } from '@/types/block';
import { blockRegistry } from './registry';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/stores/editorStore';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import './BlockWrapper.css';

interface BlockWrapperProps {
  block: Block;
  onOpenSlashMenu?: (position: { top: number; left: number }) => void;
}

export function BlockWrapper({ block, onOpenSlashMenu }: BlockWrapperProps) {
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const setFocusedBlock = useEditorStore((state) => state.setFocusedBlock);
  const selection = useEditorStore((state) => state.selection);
  const blocks = useEditorStore((state) => state.blocks);
  const { moveBlock } = useBlockEditor();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState<'top' | 'bottom' | null>(null);

  const isFocused = focusedBlockId === block.id;
  const isSelected =
    selection?.type === 'block' && selection.blockId === block.id;

  const BlockComponent = blockRegistry[block.type]?.component;

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }, [block.id]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setIsDragOver(e.clientY < midY ? 'top' : 'bottom');
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    setIsDragOver(null);

    if (draggedId === block.id) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === block.id);
    
    if (draggedIndex === -1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAbove = e.clientY < midY;
    
    let newIndex = insertAbove ? targetIndex : targetIndex + 1;
    if (draggedIndex < targetIndex) {
      newIndex = newIndex - 1;
    }

    moveBlock(draggedId, newIndex);
  }, [block.id, blocks, moveBlock]);


  if (!BlockComponent) {
    return (
      <div className="block-container">
        <div className="block-error">Unknown block type: {block.type}</div>
      </div>
    );
  }

  // Pass onOpenSlashMenu to block components
  const blockProps = {
    block,
    ...(onOpenSlashMenu && { onOpenSlashMenu }),
  };

  // Determine if this is a text block (has editable content)
  const isTextBlock = block.type === 'paragraph' || block.type === 'heading' || block.type === 'list' || block.type === 'quote';
  
  return (
    <div
      className={cn(
        'block-container',
        isFocused && 'block-focused',
        isSelected && 'block-selected',
        isDragging && 'block-dragging',
        isDragOver === 'top' && 'block-drag-over-top',
        isDragOver === 'bottom' && 'block-drag-over-bottom',
        !isTextBlock && 'block-non-text' // Add class for non-text blocks
      )}
      onClick={() => setFocusedBlock(block.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={(e) => {
        // For non-text blocks, enable dragging on mousedown
        if (!isTextBlock) {
          const handle = (e.currentTarget as HTMLElement).querySelector('.block-handle');
          if (handle && !handle.contains(e.target as Node)) {
            // User clicked on block but not on handle - start drag
            const dragEvent = new DragEvent('dragstart', {
              bubbles: true,
              cancelable: true,
            });
            Object.defineProperty(dragEvent, 'dataTransfer', {
              value: {
                setData: () => {},
                effectAllowed: 'move',
              },
            });
            handleDragStart(dragEvent as any);
          }
        }
      }}
      data-block-id={block.id}
    >
      <div
        className="block-handle"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
      <BlockComponent {...blockProps} />
    </div>
  );
}

