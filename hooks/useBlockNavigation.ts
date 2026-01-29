import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useBlockEditor } from './useBlockEditor';
import { Block } from '@/types/block';

/**
 * Hook for arrow key navigation between blocks
 */
export function useBlockNavigation() {
  const blocks = useEditorStore((state) => state.blocks);
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const setFocusedBlock = useEditorStore((state) => state.setFocusedBlock);
  const { getBlock } = useBlockEditor();

  /**
   * Get all navigable blocks in visual order (root blocks only for now)
   */
  const getNavigableBlocks = useCallback((): Block[] => {
    // For now, return root blocks (no nested blocks yet)
    return blocks.filter((b) => !b.children || b.children.length === 0);
  }, [blocks]);

  /**
   * Check if a block is a text block (can have caret)
   */
  const isTextBlock = useCallback((block: Block): boolean => {
    const textTypes = ['paragraph', 'heading'];
    return textTypes.includes(block.type);
  }, []);

  /**
   * Handle arrow key navigation
   * Returns true if navigation was handled, false otherwise
   */
  const handleArrowNavigation = useCallback(
    (
      blockId: string,
      direction: 'up' | 'down' | 'left' | 'right',
      cursorPos: number,
      content: string
    ): boolean => {
      const navigableBlocks = getNavigableBlocks();
      const currentIndex = navigableBlocks.findIndex((b) => b.id === blockId);
      if (currentIndex === -1) return false;

      const currentBlock = navigableBlocks[currentIndex];

      // Arrow Up or Left at start of block
      if (
        (direction === 'up' || direction === 'left') &&
        cursorPos === 0
      ) {
        if (currentIndex > 0) {
          const prevBlock = navigableBlocks[currentIndex - 1];
          const prevElement = document.querySelector(
            `[data-block-id="${prevBlock.id}"] .editable-block-content`
          ) as HTMLElement;

          if (prevElement) {
            if (isTextBlock(prevBlock)) {
              // Focus previous text block at end
              prevElement.focus();
              setTimeout(() => {
                const selection = window.getSelection();
                if (selection && prevElement) {
                  const range = document.createRange();
                  range.selectNodeContents(prevElement);
                  range.collapse(false); // End
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }, 0);
            } else {
              // Focus previous non-text block
              const blockElement = document.querySelector(
                `[data-block-id="${prevBlock.id}"]`
              ) as HTMLElement;
              if (blockElement) blockElement.focus();
            }
            setFocusedBlock(prevBlock.id);
            return true;
          }
        }
      }

      // Arrow Down or Right at end of block
      if (
        (direction === 'down' || direction === 'right') &&
        cursorPos === content.length
      ) {
        if (currentIndex < navigableBlocks.length - 1) {
          const nextBlock = navigableBlocks[currentIndex + 1];
          const nextElement = document.querySelector(
            `[data-block-id="${nextBlock.id}"] .editable-block-content`
          ) as HTMLElement;

          if (nextElement) {
            if (isTextBlock(nextBlock)) {
              // Focus next text block at start
              nextElement.focus();
              setTimeout(() => {
                const selection = window.getSelection();
                if (selection && nextElement) {
                  const range = document.createRange();
                  range.selectNodeContents(nextElement);
                  range.collapse(true); // Start
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }, 0);
            } else {
              // Focus next non-text block
              const blockElement = document.querySelector(
                `[data-block-id="${nextBlock.id}"]`
              ) as HTMLElement;
              if (blockElement) blockElement.focus();
            }
            setFocusedBlock(nextBlock.id);
            return true;
          }
        }
      }

      return false;
    },
    [getNavigableBlocks, isTextBlock, setFocusedBlock]
  );

  return {
    handleArrowNavigation,
    getNavigableBlocks,
    isTextBlock,
  };
}

