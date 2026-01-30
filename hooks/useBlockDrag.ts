import { useState, useRef, useCallback } from 'react';
import { Block } from '@/types/block';

interface DropTarget {
  type: 'root' | 'group';
  index: number;
  parentId?: string;
  tabId?: string;
  afterBlockId?: string;
  indentLevel?: number; // 0, 1, 2, or 3 - for tab indentation
}

interface DragState {
  isDragging: boolean;
  draggedBlockId: string | null;
  dropTarget: DropTarget | null;
  cursorPosition: { x: number; y: number } | null;
  clickOffset: { x: number; y: number } | null;
}

interface UseBlockDragOptions {
  blocks: Block[];
  onMove: (blockId: string, dropTarget: DropTarget) => void;
}

const DRAG_DELAY_MS = 800;
const MOVEMENT_THRESHOLD = 5;

export const useBlockDrag = ({ blocks, onMove }: UseBlockDragOptions) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockId: null,
    dropTarget: null,
    cursorPosition: null,
    clickOffset: null,
  });

  const dragTimerRef = useRef<number | null>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragBlockIdRef = useRef<string | null>(null);
  const isTextAreaClickRef = useRef<boolean>(false);
  const blockElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const groupElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Register block element for drop detection
  const registerBlockElement = useCallback((blockId: string, element: HTMLDivElement | null) => {
    if (element) {
      blockElementsRef.current.set(blockId, element);
    } else {
      blockElementsRef.current.delete(blockId);
    }
  }, []);

  // Register group element for drop-into detection
  const registerGroupElement = useCallback((blockId: string, element: HTMLDivElement | null) => {
    if (element) {
      groupElementsRef.current.set(blockId, element);
    } else {
      groupElementsRef.current.delete(blockId);
    }
  }, []);

  const cancelDrag = useCallback(() => {
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
    initialPositionRef.current = null;
    pendingDragBlockIdRef.current = null;
    isTextAreaClickRef.current = false;
    setDragState({
      isDragging: false,
      draggedBlockId: null,
      dropTarget: null,
      cursorPosition: null,
      clickOffset: null,
    });
  }, []);

  const startDrag = useCallback((blockId: string, clientX: number, clientY: number) => {
    const element = blockElementsRef.current.get(blockId);
    let clickOffset = { x: 0, y: 0 };

    if (element) {
      const rect = element.getBoundingClientRect();
      clickOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    setDragState({
      isDragging: true,
      draggedBlockId: blockId,
      dropTarget: null,
      cursorPosition: { x: clientX, y: clientY },
      clickOffset,
    });

    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  }, []);

  const isClickOnText = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false;
    const element = target as HTMLElement;
    return !!element.closest('[contenteditable="true"]');
  }, []);

  const handlePointerDown = useCallback((
    e: React.PointerEvent<Element>,
    blockId: string
  ) => {
    const { clientX, clientY } = e;
    initialPositionRef.current = { x: clientX, y: clientY };
    pendingDragBlockIdRef.current = blockId;
    isTextAreaClickRef.current = isClickOnText(e.target);

    if (isTextAreaClickRef.current) {
      // Start delay timer for text areas - only start drag after delay
      dragTimerRef.current = window.setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          cancelDrag();
          return;
        }
        if (pendingDragBlockIdRef.current) {
          startDrag(pendingDragBlockIdRef.current, clientX, clientY);
        }
      }, DRAG_DELAY_MS);
    }
    // For non-text areas, don't start drag yet - wait for movement
    // This prevents accidental drags when just clicking
  }, [isClickOnText, startDrag, cancelDrag]);

  // Find drop target based on cursor position
  const findDropTarget = useCallback((clientX: number, clientY: number): DropTarget | null => {
    if (!dragState.draggedBlockId) return null;

    const draggedBlock = blocks.find(b => b.id === dragState.draggedBlockId);
    if (!draggedBlock) return null;

    // First, check if cursor is inside a group's content area
    for (const [groupId, groupElement] of groupElementsRef.current) {
      if (groupId === dragState.draggedBlockId) continue;

      const groupBlock = blocks.find(b => b.id === groupId);
      if (!groupBlock) continue;

      const contentArea = groupElement.querySelector('.group-content, .tabs-content, .horizontal-scroll-container');
      if (contentArea) {
        const rect = contentArea.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          
          // Find insertion point within group
          // Note: group-tabs, group-bg, group-horizontal are not in current BlockType
          // Block.children is Block[] not string[], so extract IDs
          const children: string[] = (groupBlock.children || []).map((child: Block) => child.id);
          const isHorizontal = false; // Horizontal groups not supported in current BlockType

          // Find closest child block based on orientation
          let afterBlockId: string | undefined;
          const otherChildren = children.filter(id => id !== dragState.draggedBlockId);
          
          for (const childId of otherChildren) {
            const childElement = blockElementsRef.current.get(childId);
            if (childElement) {
              const childRect = childElement.getBoundingClientRect();
              if (isHorizontal) {
                // For horizontal groups, use X position
                const midX = childRect.left + childRect.width / 2;
                if (clientX > midX) {
                  afterBlockId = childId;
                }
              } else {
                // For vertical groups, use Y position
                const midY = childRect.top + childRect.height / 2;
                if (clientY > midY) {
                  afterBlockId = childId;
                }
              }
            }
          }

          return {
            type: 'group',
            index: blocks.findIndex(b => b.id === groupId),
            parentId: groupId,
            afterBlockId,
          };
        }
      }
    }

    // Check for root-level drop position
    // Note: Block doesn't have parentId in current structure, all blocks are root-level
    const rootBlocks = blocks;
    // Filter out the dragged block and its slaves for calculating drop position
    const blocksWithoutDragged = rootBlocks.filter(b => b.id !== dragState.draggedBlockId);
    
    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < blocksWithoutDragged.length; i++) {
      const block = blocksWithoutDragged[i];

      const element = blockElementsRef.current.get(block.id);
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - midY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = clientY < midY ? i : i + 1;
      }
    }

    // Handle dropping at end
    if (blocksWithoutDragged.length > 0) {
      const lastBlock = blocksWithoutDragged[blocksWithoutDragged.length - 1];
      const lastElement = blockElementsRef.current.get(lastBlock.id);
      if (lastElement) {
        const rect = lastElement.getBoundingClientRect();
        if (clientY > rect.bottom) {
          closestIndex = blocksWithoutDragged.length;
        }
      }
    }

    // Inherit indent level from the block above
    let dropIndentLevel = 0;
    
    if (closestIndex > 0) {
      const blockAbove = blocksWithoutDragged[closestIndex - 1];
      if (blockAbove) {
        dropIndentLevel = blockAbove.indent || 0;
      }
    }
    
    // Only text blocks can have indentation
    const textTypes = ['body', 'title', 'title-big', 'title-medium', 'title-small', 'todo', 'paragraph', 'heading'];
    if (!textTypes.includes(draggedBlock.type)) {
      dropIndentLevel = 0;
    }

    return {
      type: 'root',
      index: closestIndex,
      indentLevel: dropIndentLevel,
    };
  }, [blocks, dragState.draggedBlockId]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const { clientX, clientY } = e;

    // Handle movement during pending drag (before drag actually starts)
    if (!dragState.isDragging && pendingDragBlockIdRef.current && initialPositionRef.current) {
      const dx = Math.abs(clientX - initialPositionRef.current.x);
      const dy = Math.abs(clientY - initialPositionRef.current.y);
      
      if (isTextAreaClickRef.current) {
        // For text areas, cancel if moved during delay (user is selecting text)
        if (dx > MOVEMENT_THRESHOLD || dy > MOVEMENT_THRESHOLD) {
          cancelDrag();
          return;
        }
      } else {
        // For non-text areas, start drag only after movement threshold
        if (dx > MOVEMENT_THRESHOLD || dy > MOVEMENT_THRESHOLD) {
          startDrag(pendingDragBlockIdRef.current, clientX, clientY);
        }
      }
      return;
    }

    if (!dragState.isDragging) return;

    e.preventDefault();
    const dropTarget = findDropTarget(clientX, clientY);

    setDragState(prev => ({
      ...prev,
      cursorPosition: { x: clientX, y: clientY },
      dropTarget,
    }));
  }, [dragState.isDragging, findDropTarget, cancelDrag, startDrag]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    // Clear any pending drag that never started
    pendingDragBlockIdRef.current = null;
    
    if (dragState.isDragging && dragState.draggedBlockId && dragState.dropTarget) {
      e.preventDefault();
      onMove(dragState.draggedBlockId, dragState.dropTarget);
    }
    cancelDrag();
  }, [dragState, onMove, cancelDrag]);

  // Get element for drag preview
  const getDraggedElement = useCallback((): HTMLDivElement | null => {
    if (dragState.draggedBlockId) {
      return blockElementsRef.current.get(dragState.draggedBlockId) || null;
    }
    return null;
  }, [dragState.draggedBlockId]);

  return {
    dragState,
    registerBlockElement,
    registerGroupElement,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    getDraggedElement,
    cancelDrag,
  };
};

