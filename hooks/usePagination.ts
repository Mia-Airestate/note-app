import { useEffect, useRef, useCallback } from 'react';
import { FlowBlock } from '@/types/block';
import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';

const PAGE_HEIGHT = 1056; // A4 height at 96dpi (11 inches)
const PAGE_PADDING = 48; // Inner padding (var(--spacing-xl) = 24px * 2)

/**
 * Hook for automatic pagination of flow blocks
 * Measures block heights and splits overflowing content to next page
 */
export function usePagination() {
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /**
   * Split a block at word boundaries to fit within page height
   */
  const splitBlock = useCallback((block: FlowBlock, splitAt: number): { before: FlowBlock; after: FlowBlock } => {
    const content = block.content;
    const beforeContent = content.substring(0, splitAt).trim();
    const afterContent = content.substring(splitAt).trim();

    // Preserve formatting for both parts
    const beforeFormats = block.formats?.filter(f => f.end <= splitAt) || [];
    const afterFormats = block.formats?.filter(f => f.start >= splitAt).map(f => ({
      ...f,
      start: f.start - splitAt,
      end: f.end - splitAt,
    })) || [];

    const before: FlowBlock = {
      ...block,
      id: `${block.id}-before`,
      content: beforeContent,
      formats: beforeFormats,
    };

    const after: FlowBlock = {
      ...block,
      id: `${block.id}-after`,
      content: afterContent,
      formats: afterFormats,
    };

    return { before, after };
  }, []);

  /**
   * Find the best split point in a block (at word boundary)
   */
  const findSplitPoint = useCallback((content: string, maxLength: number): number => {
    if (maxLength >= content.length) return content.length;
    
    // Try to split at word boundary
    let splitAt = maxLength;
    while (splitAt > 0 && content[splitAt] !== ' ' && content[splitAt] !== '\n') {
      splitAt--;
    }
    
    // If no space found, split at maxLength anyway
    if (splitAt === 0) splitAt = maxLength;
    
    return splitAt;
  }, []);

  /**
   * Measure and paginate flow blocks
   */
  const paginateBlocks = useCallback(() => {
    const activePage = selectedNoteId ? getActivePage() : null;
    if (!activePage || !flowContainerRef.current) return;

    const flowBlocks = activePage.flowBlocks || [];
    if (flowBlocks.length === 0) return;

    const pages: FlowBlock[][] = [];
    let currentPage: FlowBlock[] = [];
    let currentPageHeight = 0;
    const availableHeight = PAGE_HEIGHT - PAGE_PADDING * 2;

    for (const block of flowBlocks) {
      // Check for manual page break
      if (block.pageBreak) {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
          currentPageHeight = 0;
        }
        // Page break marker itself doesn't take space
        continue;
      }

      const blockElement = blockRefs.current.get(block.id);
      if (!blockElement) {
        // Block not yet rendered, add to current page
        currentPage.push(block);
        continue;
      }

      const blockHeight = blockElement.offsetHeight;
      const blockRect = blockElement.getBoundingClientRect();

      // If block fits on current page
      if (currentPageHeight + blockHeight <= availableHeight) {
        currentPage.push(block);
        currentPageHeight += blockHeight;
      } else {
        // Block doesn't fit - need to split or move to next page
        if (blockHeight > availableHeight) {
          // Block is too large for a single page - split it
          // For now, move entire block to next page (splitting will be handled later)
          if (currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
          currentPage.push(block);
          currentPageHeight = blockHeight;
        } else {
          // Block fits on next page
          if (currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
          currentPage.push(block);
          currentPageHeight = blockHeight;
        }
      }
    }

    // Add last page if it has content
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // For now, we just measure - actual splitting will be implemented in a later iteration
    // This hook provides the foundation for pagination logic
  }, [selectedNoteId, getActivePage, findSplitPoint, splitBlock]);

  /**
   * Register a block element for measurement
   */
  const registerBlock = useCallback((blockId: string, element: HTMLDivElement | null) => {
    if (element) {
      blockRefs.current.set(blockId, element);
    } else {
      blockRefs.current.delete(blockId);
    }
  }, []);

  // Measure blocks when they change
  useEffect(() => {
    if (!flowContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      // Debounce pagination updates
      const timeoutId = setTimeout(() => {
        paginateBlocks();
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    // Observe all block elements
    blockRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [paginateBlocks]);

  return {
    flowContainerRef,
    registerBlock,
    paginateBlocks,
  };
}

