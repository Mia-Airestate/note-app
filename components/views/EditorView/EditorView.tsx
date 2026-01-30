'use client';

import { useEffect, useRef, useState } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { usePageData } from '@/hooks/usePageData';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import { SlashMenu } from '@/components/menus/SlashMenu/SlashMenu';
import { MarkdownCodeView } from '@/components/blocks/MarkdownCodeView/MarkdownCodeView';
import { PageContainer } from './PageContainer';
import { BlockType } from '@/types/block';
import { parseMarkdownToBlocks } from '@/utils/markdownParser';
import { serializeBlocksToMarkdown } from '@/utils/markdownSerializer';
import './EditorView.css';
import { TopBar } from '@/components/layout/TopBar/TopBar';

export function EditorView() {
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);
  const setBlocks = useEditorStore((state) => state.setBlocks);
  const viewMode = useEditorStore((state) => state.viewMode);
  const previousMarkdownRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);
  const isSyncingRef = useRef(false);
  const markdownFromBlocksRef = useRef<string>('');
  const [localMarkdown, setLocalMarkdown] = useState<string>('');
  const { isOpen, position, searchQuery, openMenu, closeMenu, updateSearch } = useSlashMenu();
  const { addBlock, createBlock } = useBlockEditor();
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const setFocusedBlock = useEditorStore((state) => state.setFocusedBlock);
  const hasAutoFocusedRef = useRef(false);
  const [splitWidth, setSplitWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);

  // Register editor-specific keyboard shortcuts
  useEditorShortcuts();

  // Use unified hook to get page data from IndexedDB
  const { page: activePage, isLoading: isPageLoading } = usePageData(selectedNoteId);

  const handleSlashMenuSelect = (type: BlockType) => {
    let newBlockId: string;
    if (focusedBlockId) {
      newBlockId = addBlock(type, focusedBlockId);
    } else {
      const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1].id : undefined;
      newBlockId = addBlock(type, lastBlockId);
    }
    closeMenu();
    
    // Focus the new block after a short delay to ensure it's rendered
    setTimeout(() => {
      const newBlockElement = document.querySelector(
        `[data-block-id="${newBlockId}"] .editable-block-content`
      ) as HTMLElement;
      if (newBlockElement) {
        newBlockElement.focus();
        // Set caret at start
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(newBlockElement);
          range.collapse(true); // Start
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 10);
  };

  // Load markdown and parse to blocks when page changes
  useEffect(() => {
    if (activePage) {
      const markdown = activePage.markdown || '';
      console.log(`📝 [EditorView] Loading markdown for page ${activePage.id}:`, {
        markdownLength: markdown.length,
        markdownPreview: markdown.substring(0, 100),
        previousMarkdown: previousMarkdownRef.current.substring(0, 100),
        markdownFromBlocks: markdownFromBlocksRef.current.substring(0, 100),
      });
      
      // Only update if markdown actually changed (from storage, not from our own updates)
      if (markdown !== previousMarkdownRef.current && markdown !== markdownFromBlocksRef.current) {
        isSyncingRef.current = true;
        let parsedBlocks = parseMarkdownToBlocks(markdown);
        console.log(`📝 [EditorView] Parsed ${parsedBlocks.length} blocks from markdown`);
        
        // Only create empty block if markdown is actually empty (not just if parsing failed)
        // This prevents overwriting content when markdown exists but parsing returns 0 blocks
        const isMarkdownEmpty = !markdown || markdown.trim() === '';
        if (parsedBlocks.length === 0 && isMarkdownEmpty) {
          // Only for truly empty markdown (new notes)
          const emptyBlock = createBlock('paragraph', '');
          parsedBlocks = [emptyBlock];
          // Save the initial block to markdown immediately
          const newMarkdown = serializeBlocksToMarkdown(parsedBlocks);
          previousMarkdownRef.current = newMarkdown;
          markdownFromBlocksRef.current = newMarkdown;
          setLocalMarkdown(newMarkdown);
          // Save to storage - use selectedNoteId if available, otherwise activePage.id
          const pageId = selectedNoteId || activePage.id;
          if (pageId) {
            updatePage(pageId, { markdown: newMarkdown });
          }
        } else if (parsedBlocks.length === 0 && !isMarkdownEmpty) {
          // Markdown exists but parsing returned 0 blocks - this shouldn't happen
          // but if it does, preserve the original markdown and try to parse again
          console.warn(`📝 [EditorView] Markdown exists but parsed to 0 blocks. Markdown: "${markdown.substring(0, 50)}"`);
          // Don't overwrite - keep the original markdown
          previousMarkdownRef.current = markdown;
          setLocalMarkdown(markdown);
          // Create a single paragraph block with the markdown content as fallback
          const fallbackBlock = createBlock('paragraph', markdown);
          parsedBlocks = [fallbackBlock];
        } else {
          // Normal case - blocks parsed successfully
          previousMarkdownRef.current = markdown;
          setLocalMarkdown(markdown);
        }
        
        setBlocks(parsedBlocks);
        console.log(`📝 [EditorView] Set ${parsedBlocks.length} blocks in editor store`);
        isInitialLoadRef.current = true;
        hasAutoFocusedRef.current = false; // Reset auto-focus flag for new page
        isSyncingRef.current = false;
      } else {
        console.log(`📝 [EditorView] Markdown unchanged, skipping update`);
      }
    } else {
      console.log('📝 [EditorView] No activePage, clearing blocks');
      setBlocks([]);
      setLocalMarkdown('');
      previousMarkdownRef.current = '';
      isInitialLoadRef.current = true;
      hasAutoFocusedRef.current = false;
    }
  }, [activePage?.id, activePage?.markdown, setBlocks, createBlock, updatePage, selectedNoteId]);

  // Auto-focus first block when blocks are loaded (especially for new pages)
  useEffect(() => {
    if (activePage && blocks.length > 0 && !hasAutoFocusedRef.current && !isSyncingRef.current) {
      // Find first editable block (paragraph, heading, list, quote)
      const editableTypes = ['paragraph', 'heading', 'list', 'quote'];
      const firstEditableBlock = blocks.find(block => editableTypes.includes(block.type)) || blocks[0];
      
      if (firstEditableBlock) {
        // Set focused block ID
        setFocusedBlock(firstEditableBlock.id);
        hasAutoFocusedRef.current = true;
        
        // Focus the contentEditable element after a brief delay to ensure it's rendered
        const focusBlock = () => {
          const blockElement = document.querySelector(
            `[data-block-id="${firstEditableBlock.id}"] .editable-block-content`
          ) as HTMLElement;
          
          if (blockElement) {
            blockElement.focus();
            // Set cursor to start of block
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.selectNodeContents(blockElement);
              range.collapse(true); // Collapse to start
              selection.removeAllRanges();
              selection.addRange(range);
            }
            return true;
          }
          return false;
        };
        
        // Try immediately, then with delays if needed
        if (!focusBlock()) {
          const focusTimeout = setTimeout(() => {
            if (!focusBlock()) {
              // Final retry after longer delay
              setTimeout(focusBlock, 300);
            }
          }, 100);
          
          return () => clearTimeout(focusTimeout);
        }
      }
    }
  }, [blocks.length, activePage?.id, setFocusedBlock]);

  // Ensure blocks are always initialized (fallback for edge cases)
  // Only create empty block if markdown is actually empty - don't overwrite existing content
  useEffect(() => {
    if (activePage && selectedNoteId && activePage.id === selectedNoteId && blocks.length === 0 && !isSyncingRef.current) {
      const markdown = activePage.markdown || '';
      // Only create empty block if markdown is truly empty (new note)
      // Don't overwrite existing content
      if (!markdown || markdown.trim() === '') {
        console.log(`📝 [EditorView] Creating empty block for new note ${selectedNoteId}`);
        const emptyBlock = createBlock('paragraph', '');
        setBlocks([emptyBlock]);
        const newMarkdown = serializeBlocksToMarkdown([emptyBlock]);
        setLocalMarkdown(newMarkdown);
        // Use selectedNoteId directly to ensure correct page ID
        updatePage(selectedNoteId, { markdown: newMarkdown });
      } else {
        // Markdown exists but blocks are empty - try to parse it
        console.log(`📝 [EditorView] Markdown exists but blocks empty, parsing markdown:`, markdown.substring(0, 50));
        const parsedBlocks = parseMarkdownToBlocks(markdown);
        if (parsedBlocks.length > 0) {
          setBlocks(parsedBlocks);
          setLocalMarkdown(markdown);
          previousMarkdownRef.current = markdown;
        }
      }
    }
  }, [activePage?.id, activePage?.markdown, selectedNoteId, blocks.length, setBlocks, createBlock, updatePage]);

  // Serialize blocks to markdown when blocks change
  useEffect(() => {
    // Ensure we have both activePage and selectedNoteId, and they match
    if (activePage && selectedNoteId && activePage.id === selectedNoteId && !isInitialLoadRef.current && !isSyncingRef.current) {
      const markdown = serializeBlocksToMarkdown(blocks);
      
      console.log(`📝 [EditorView] Serializing blocks to markdown:`, {
        pageId: selectedNoteId,
        blocksCount: blocks.length,
        markdownLength: markdown.length,
        markdownPreview: markdown.substring(0, 100),
        previousMarkdownLength: markdownFromBlocksRef.current.length,
        changed: markdown !== markdownFromBlocksRef.current,
      });
      
      // Only update if markdown actually changed
      if (markdown !== markdownFromBlocksRef.current) {
        isSyncingRef.current = true;
        markdownFromBlocksRef.current = markdown;
        previousMarkdownRef.current = markdown;
        setLocalMarkdown(markdown);
        // Use selectedNoteId directly to ensure correct page ID
        console.log(`📝 [EditorView] Calling updatePage for ${selectedNoteId} with markdown length:`, markdown.length);
        updatePage(selectedNoteId, { markdown });
        // Clear sync flag after update
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      } else {
        console.log(`📝 [EditorView] Markdown unchanged, skipping update`);
      }
    } else if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [blocks, activePage?.id, selectedNoteId, updatePage]);

  // Handle markdown view changes
  const handleMarkdownChange = (newMarkdown: string) => {
    // Ensure we have both activePage and selectedNoteId, and they match
    if (activePage && selectedNoteId && activePage.id === selectedNoteId && !isSyncingRef.current) {
      isSyncingRef.current = true;
      previousMarkdownRef.current = newMarkdown;
      setLocalMarkdown(newMarkdown);
      
      // Update storage - use selectedNoteId directly to ensure correct page ID
      updatePage(selectedNoteId, { markdown: newMarkdown });
      
      // Parse and update blocks for note view
      const parsedBlocks = parseMarkdownToBlocks(newMarkdown);
      setBlocks(parsedBlocks);
      
      // Clear sync flag after update
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  };

  // Handle clicks on empty space to focus last block
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't interfere if clicking directly on a block or its content
    const target = e.target as HTMLElement;
    if (target.closest('[data-block-id]')) {
      return;
    }

    if (blocks.length === 0) return;

    // Focus the last block
    const lastBlock = blocks[blocks.length - 1];
    const lastBlockElement = document.querySelector(
      `[data-block-id="${lastBlock.id}"] .editable-block-content`
    ) as HTMLElement;

    if (!lastBlockElement) return;

    // Set focused block in store
    setFocusedBlock(lastBlock.id);

    // Focus the editable content and position caret at end
    lastBlockElement.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(lastBlockElement);
      range.collapse(false); // End
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Handle split view resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !splitViewRef.current) return;
      
      const container = splitViewRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      
      // Clamp between 20% and 80%
      const clampedPercentage = Math.max(20, Math.min(80, percentage));
      setSplitWidth(clampedPercentage);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!activePage) {
    return (
      <div className="editor-view editor-view-empty">
        <div className="editor-view-empty-content">
          <p className="editor-view-empty-title">No note selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-view">
      <PageContainer>
        <TopBar />
        
        <div className="editor-split-view" ref={splitViewRef}>
          {/* Note View (Left) */}
          <div 
            className="editor-split-pane editor-note-pane"
            style={{ width: viewMode === 'markdown' ? `${splitWidth}%` : '100%' }}
          >
            <div className="editor-view-blocks-container">
              <div className="editor-view-blocks" onClick={handleEditorClick}>
                {blocks.length === 0 ? (
                  // Fallback: render a temporary block if blocks array is empty
                  // This should rarely happen as the useEffect above ensures at least one block
                  (() => {
                    const tempBlock = createBlock('paragraph', '');
                    return (
                      <BlockWrapper
                        key={tempBlock.id}
                        block={tempBlock}
                        onOpenSlashMenu={openMenu}
                      />
                    );
                  })()
                ) : (
                  blocks.map((block) => (
                    <BlockWrapper
                      key={block.id}
                      block={block}
                      onOpenSlashMenu={openMenu}
                    />
                  ))
                )}
              </div>
              <SlashMenu
                isOpen={isOpen}
                position={position}
                searchQuery={searchQuery}
                onSelect={handleSlashMenuSelect}
                onClose={closeMenu}
              />
            </div>
          </div>

          {/* Resizer */}
          {viewMode === 'markdown' && (
            <div
              className="editor-split-resizer"
              onMouseDown={handleMouseDown}
            />
          )}

          {/* Markdown View (Right) */}
          {viewMode === 'markdown' && (
            <div 
              className="editor-split-pane editor-markdown-pane"
              style={{ width: `${100 - splitWidth}%` }}
            >
              <MarkdownCodeView
                markdown={localMarkdown}
                onChange={handleMarkdownChange}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

