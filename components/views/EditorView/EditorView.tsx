'use client';

import { useEffect, useRef, useMemo } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import { SlashMenu } from '@/components/menus/SlashMenu/SlashMenu';
import { PageContainer } from './PageContainer';
import { BlockType } from '@/types/block';
import { flowBlockToBlock } from '@/utils/blockConversion';
import { migratePage } from '@/utils/migratePage';
import './EditorView.css';
import { TopBar } from '@/components/layout/TopBar/TopBar';

export function EditorView() {
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);
  const setBlocks = useEditorStore((state) => state.setBlocks);
  const previousBlocksRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);
  const { isOpen, position, searchQuery, openMenu, closeMenu, updateSearch } = useSlashMenu();
  const { addBlock } = useBlockEditor();
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);

  // Register editor-specific keyboard shortcuts
  useEditorShortcuts();

  const handleSlashMenuSelect = (type: BlockType) => {
    if (focusedBlockId) {
      addBlock(type, focusedBlockId);
    } else {
      const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1].id : undefined;
      addBlock(type, lastBlockId);
    }
    closeMenu();
  };

  // Convert page structure to blocks for editorStore compatibility
  const activePage = useMemo(() => {
    const page = selectedNoteId ? getActivePage() : null;
    return page ? migratePage(page) : null;
  }, [selectedNoteId, getActivePage]);

  useEffect(() => {
    if (activePage) {
      // Convert flowBlocks to blocks array for editorStore
      const flowBlocksAsBlocks = activePage.flowBlocks.map(flowBlockToBlock);
      
      const blocksJson = JSON.stringify(flowBlocksAsBlocks);
      // Only update if blocks actually changed
      if (blocksJson !== previousBlocksRef.current) {
        setBlocks(flowBlocksAsBlocks);
        previousBlocksRef.current = blocksJson;
        isInitialLoadRef.current = true;
      }
    } else {
      setBlocks([]);
      previousBlocksRef.current = '';
      isInitialLoadRef.current = true;
    }
  }, [activePage, setBlocks]);

  useEffect(() => {
    if (activePage && blocks.length > 0 && !isInitialLoadRef.current) {
      // Convert blocks back to flowBlocks
      const flowBlocks = blocks.map(block => ({
        id: block.id,
        type: block.type as any,
        content: block.content,
        formats: block.formats,
        props: block.props as any,
        children: block.children as any,
        indent: block.indent,
        pageBreak: block.type === 'pageBreak',
      }));

      const blocksJson = JSON.stringify({ flowBlocks, floatingObjects: [] });
      // Only update if blocks actually changed
      if (blocksJson !== previousBlocksRef.current) {
        updatePage(activePage.id, { flowBlocks, floatingObjects: [] });
        previousBlocksRef.current = blocksJson;
      }
    } else if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [blocks, activePage, updatePage]);

  if (!activePage) {
    return (
      <div className="editor-view editor-view-empty">
        <div className="editor-view-empty-content">
          <h2 className="editor-view-empty-title">No note selected</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-view">
      <PageContainer>
        <TopBar />

        {blocks.length === 0 ? (
          <div className="editor-view-placeholder">
            <p className="text-tertiary">Start typing...</p>
            <p className="editor-view-slash-hint text-tertiary">/text</p>
          </div>
        ) : (
          <div className="editor-view-blocks-container">
            <div className="editor-view-blocks">
              {blocks.map((block) => (
                <BlockWrapper
                  key={block.id}
                  block={block}
                  onOpenSlashMenu={openMenu}
                />
              ))}
            </div>
            <SlashMenu
              isOpen={isOpen}
              position={position}
              searchQuery={searchQuery}
              onSelect={handleSlashMenuSelect}
              onClose={closeMenu}
            />
          </div>
        )}
      </PageContainer>
    </div>
  );
}

