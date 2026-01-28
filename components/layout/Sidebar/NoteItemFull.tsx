'use client';

import { Page } from '@/types/page';
import { cn } from '@/utils/cn';
import { formatNoteDate, getNotePreview } from '@/utils/dateGrouping';
import { highlightText } from '@/utils/highlightText';
import './NoteItem.css';

interface NoteItemProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  searchQuery?: string;
}

export function NoteItemFull({ page, isActive, onClick, onDelete, searchQuery }: NoteItemProps) {
  const preview = getNotePreview(page.blocks);
  const dateStr = formatNoteDate(page.updatedAt);

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
          {preview && (
            <div className="note-item-preview">{preview}</div>
          )}
          <div className="note-item-meta">{dateStr}</div>
        </div>
      </button>
    </div>
  );
}
