import { Page } from '@/types/page';
import { cn } from '@/utils/cn';
import { formatNoteDate, getNotePreview } from '@/utils/dateGrouping';
import './NoteItem.css';

interface NoteItemProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
}

export function NoteItem({ page, isActive, onClick }: NoteItemProps) {
  const preview = getNotePreview(page.blocks);
  const dateStr = formatNoteDate(page.updatedAt);

  return (
    <button
      className={cn('note-item', isActive && 'note-item-active')}
      onClick={onClick}
    >
      <div className="note-item-content">
        <div className="note-item-title">{page.title}</div>
        {preview && (
          <div className="note-item-preview">{preview}</div>
        )}
        <div className="note-item-meta">{dateStr}</div>
      </div>
    </button>
  );
}
