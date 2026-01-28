'use client';

import { useEffect } from 'react';
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

  const activePage = selectedNoteId ? getActivePage() : null;

  useEffect(() => {
    if (activePage) {
      setBlocks(activePage.blocks);
    } else {
      setBlocks([]);
    }
  }, [activePage, setBlocks]);

  useEffect(() => {
    if (activePage && blocks.length > 0) {
      updatePage(activePage.id, { blocks });
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

