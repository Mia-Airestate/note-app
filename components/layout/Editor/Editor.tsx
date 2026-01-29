'use client';

import { useEffect } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import './Editor.css';

export function Editor() {
  const activePage = usePageStore((state) => state.getActivePage());
  const blocks = useEditorStore((state) => state.blocks);
  const setBlocks = useEditorStore((state) => state.setBlocks);

  useEffect(() => {
    if (activePage) {
      // Use flowBlocks if available, otherwise fall back to blocks for backward compatibility
      const blocksToSet = activePage.flowBlocks 
        ? activePage.flowBlocks.map(flowBlock => ({
            id: flowBlock.id,
            type: flowBlock.type as any,
            content: flowBlock.content,
            formats: flowBlock.formats,
            props: flowBlock.props as any,
            children: flowBlock.children as any,
            indent: flowBlock.indent,
            layoutMode: 'flow' as const,
          }))
        : (activePage.blocks || []);
      setBlocks(blocksToSet);
    } else {
      setBlocks([]);
    }
  }, [activePage, setBlocks]);

  if (!activePage) {
    return (
      <div className="editor editor-empty">
        <div className="editor-empty-content">
          <h2 className="editor-empty-title">No note selected</h2>
          <p className="text-secondary">
            Select a note from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title-input"
          value={activePage.title}
          placeholder="Untitled"
          readOnly
        />
      </div>
      <div className="editor-content">
        {blocks.length === 0 ? (
          <div className="editor-placeholder">
            <p className="text-tertiary">Start typing...</p>
          </div>
        ) : (
          <div className="editor-blocks">
            {blocks.map((block) => (
              <BlockWrapper key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

