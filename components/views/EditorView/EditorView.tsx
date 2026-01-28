'use client';

import { useEffect, useRef } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import './EditorView.css';

export function EditorView() {
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);
  const setBlocks = useEditorStore((state) => state.setBlocks);
  const previousBlocksRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const activePage = selectedNoteId ? getActivePage() : null;
    if (activePage) {
      const blocksJson = JSON.stringify(activePage.blocks);
      // Only update if blocks actually changed
      if (blocksJson !== previousBlocksRef.current) {
        setBlocks(activePage.blocks);
        previousBlocksRef.current = blocksJson;
        isInitialLoadRef.current = true;
      }
    } else {
      setBlocks([]);
      previousBlocksRef.current = '';
      isInitialLoadRef.current = true;
    }
  }, [selectedNoteId, getActivePage, setBlocks]);

  useEffect(() => {
    const activePage = selectedNoteId ? getActivePage() : null;
    if (activePage && blocks.length > 0 && !isInitialLoadRef.current) {
      const blocksJson = JSON.stringify(blocks);
      // Only update if blocks actually changed
      if (blocksJson !== previousBlocksRef.current) {
        updatePage(activePage.id, { blocks });
        previousBlocksRef.current = blocksJson;
      }
    } else if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [blocks, selectedNoteId, getActivePage, updatePage]);

  const activePage = selectedNoteId ? getActivePage() : null;

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
      <div className="editor-view-content">
        {blocks.length === 0 ? (
          <div className="editor-view-placeholder">
            <p className="text-tertiary">Start typing...</p>
            <p className="editor-view-slash-hint text-tertiary">/text</p>
          </div>
        ) : (
          <div className="editor-view-blocks">
            {blocks.map((block) => (
              <BlockWrapper key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

