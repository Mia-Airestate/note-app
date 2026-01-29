import { useCallback } from 'react';
import { Block, BlockType, HeadingLevel, ListType } from '@/types/block';
import { useEditorStore } from '@/stores/editorStore';
import { generateId } from '@/utils/id';

/**
 * Hook for block editor operations
 * Integrates with editorStore (Zustand) for state management
 */
export function useBlockEditor() {
  const blocks = useEditorStore((state) => state.blocks);
  const setBlocks = useEditorStore((state) => state.setBlocks);
  const setFocusedBlock = useEditorStore((state) => state.setFocusedBlock);
  const setCaretPosition = useEditorStore((state) => state.setCaretPosition);

  /**
   * Create a new block with default values based on type
   */
  const createBlock = useCallback(
    (
      type: BlockType,
      content: string = '',
      props?: Block['props']
    ): Block => {
      const block: Block = {
        id: generateId(),
        type,
        content,
        props,
      };

      // Set default props based on block type
      if (type === 'heading' && !props?.level) {
        block.props = { ...props, level: 1 };
      }
      if (type === 'list' && !props?.listType) {
        block.props = { ...props, listType: 'unordered' };
      }
      if (type === 'code' && !props?.language) {
        block.props = { ...props, language: 'plaintext' };
      }

      // Images are always floating objects (absolute positioning)
      if (type === 'image') {
        block.layoutMode = 'absolute';
        block.position = { x: 100, y: 100, z: 0 }; // Default position
        block.size = { width: 300, height: 200 }; // Default size
      }

      return block;
    },
    []
  );

  /**
   * Add a new block after the specified block ID
   * If afterBlockId is not provided, adds to the end
   */
  const addBlock = useCallback(
    (
      type: BlockType,
      afterBlockId?: string,
      content: string = '',
      props?: Block['props']
    ): string => {
      const newBlock = createBlock(type, content, props);
      const currentBlocks = useEditorStore.getState().blocks;

      let newBlocks: Block[];
      if (afterBlockId) {
        const index = currentBlocks.findIndex((b) => b.id === afterBlockId);
        if (index >= 0) {
          newBlocks = [...currentBlocks];
          newBlocks.splice(index + 1, 0, newBlock);
        } else {
          // Add to end if block not found
          newBlocks = [...currentBlocks, newBlock];
        }
      } else {
        // Add to end if no afterBlockId
        newBlocks = [...currentBlocks, newBlock];
      }

      setBlocks(newBlocks);

      // Focus the new block
      setFocusedBlock(newBlock.id);
      setCaretPosition(0);

      return newBlock.id;
    },
    [createBlock, setBlocks, setFocusedBlock, setCaretPosition]
  );

  /**
   * Update a block by ID
   */
  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) => {
      const currentBlocks = useEditorStore.getState().blocks;
      const newBlocks = currentBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      );
      setBlocks(newBlocks);
    },
    [setBlocks]
  );

  /**
   * Delete a block by ID
   * If the deleted block was focused, focus the previous block or first block
   */
  const deleteBlock = useCallback(
    (id: string) => {
      const currentBlocks = useEditorStore.getState().blocks;
      const blockToDelete = currentBlocks.find((b) => b.id === id);
      if (!blockToDelete) return;

      const newBlocks = currentBlocks.filter((block) => block.id !== id);
      setBlocks(newBlocks);

      // Update focus if deleted block was focused
      const focusedId = useEditorStore.getState().focusedBlockId;
      if (focusedId === id) {
        if (newBlocks.length > 0) {
          const deletedIndex = currentBlocks.findIndex((b) => b.id === id);
          const newFocusedIndex = Math.max(0, deletedIndex - 1);
          const newFocusedBlock = newBlocks[newFocusedIndex];
          setFocusedBlock(newFocusedBlock.id);
          setCaretPosition(
            newFocusedBlock.content.length > 0
              ? newFocusedBlock.content.length
              : 0
          );
        } else {
          setFocusedBlock(null);
          setCaretPosition(null);
        }
      }
    },
    [setBlocks, setFocusedBlock, setCaretPosition]
  );

  /**
   * Move a block to a new position
   */
  const moveBlock = useCallback(
    (id: string, newPosition: number) => {
      const currentBlocks = useEditorStore.getState().blocks;
      const currentIndex = currentBlocks.findIndex((b) => b.id === id);
      if (currentIndex === -1) return;

      const newBlocks = [...currentBlocks];
      const [block] = newBlocks.splice(currentIndex, 1);
      const clampedPosition = Math.max(
        0,
        Math.min(newPosition, newBlocks.length)
      );
      newBlocks.splice(clampedPosition, 0, block);
      setBlocks(newBlocks);
    },
    [setBlocks]
  );

  /**
   * Move a block up (decrease index)
   */
  const moveBlockUp = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index > 0) {
        moveBlock(id, index - 1);
      }
    },
    [blocks, moveBlock]
  );

  /**
   * Move a block down (increase index)
   */
  const moveBlockDown = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index >= 0 && index < blocks.length - 1) {
        moveBlock(id, index + 1);
      }
    },
    [blocks, moveBlock]
  );

  /**
   * Duplicate a block
   */
  const duplicateBlock = useCallback(
    (id: string) => {
      const currentBlocks = useEditorStore.getState().blocks;
      const blockToDuplicate = currentBlocks.find((b) => b.id === id);
      if (!blockToDuplicate) return;

      const duplicatedBlock: Block = {
        ...blockToDuplicate,
        id: generateId(),
      };

      const index = currentBlocks.findIndex((b) => b.id === id);
      const newBlocks = [...currentBlocks];
      newBlocks.splice(index + 1, 0, duplicatedBlock);
      setBlocks(newBlocks);

      setFocusedBlock(duplicatedBlock.id);
      setCaretPosition(0);

      return duplicatedBlock.id;
    },
    [setBlocks, setFocusedBlock, setCaretPosition]
  );

  /**
   * Get block by ID
   */
  const getBlock = useCallback(
    (id: string): Block | undefined => {
      return blocks.find((block) => block.id === id);
    },
    [blocks]
  );

  /**
   * Get block index by ID
   */
  const getBlockIndex = useCallback(
    (id: string): number => {
      return blocks.findIndex((block) => block.id === id);
    },
    [blocks]
  );

  return {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    moveBlockUp,
    moveBlockDown,
    duplicateBlock,
    getBlock,
    getBlockIndex,
    createBlock,
  };
}

