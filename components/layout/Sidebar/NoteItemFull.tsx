'use client';

import { useMemo } from 'react';
import { Page } from '@/types/page';
import { cn } from '@/utils/cn';
import { formatNoteDate } from '@/utils/dateGrouping';
import { highlightText } from '@/utils/highlightText';
import { parseMarkdownToBlocks } from '@/utils/markdownParser';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import './NoteItem.css';

interface NoteItemProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  searchQuery?: string;
}

export function NoteItemFull({ page, isActive, onClick, onDelete, searchQuery }: NoteItemProps) {
  const dateStr = formatNoteDate(page.updatedAt);
  const { createBlock } = useBlockEditor();

  // Parse markdown to blocks (same as EditorView)
  const blocks = useMemo(() => {
    const markdown = page.markdown || '';
    let parsedBlocks = parseMarkdownToBlocks(markdown);
    
    // Ensure at least one block exists (same as EditorView)
    if (parsedBlocks.length === 0) {
      const emptyBlock = createBlock('paragraph', '');
      parsedBlocks = [emptyBlock];
    }
    
    return parsedBlocks;
  }, [page.markdown, createBlock]);

  console.log(`📋 [NoteItemFull] Rendering page:`, {
    id: page.id,
    title: page.title,
    markdownLength: (page.markdown || '').length,
    markdownPreview: (page.markdown || '').substring(0, 100),
    blocksCount: blocks.length,
    updatedAt: new Date(page.updatedAt).toISOString(),
    isActive,
  });

  return (
    <div className="note-item-wrapper">
      <button
        className={cn('note-item full', isActive && 'note-item-active')}
        onClick={onClick}
      >
        <div className="note-item-content">
          <div className="note-item-title">
            {searchQuery ? highlightText(page.title, searchQuery) : page.title}
          </div>
          <hr className="note-item-divider" />
          {blocks.length > 0 && (
            <div className="note-item-preview note-item-blocks-preview">
              {blocks.map((block) => (
                <BlockWrapper
                  key={block.id}
                  block={block}
                />
              ))}
            </div>
          )}
          <div className="note-item-meta">{dateStr}</div>
        </div>
      </button>
    </div>
  );
}
