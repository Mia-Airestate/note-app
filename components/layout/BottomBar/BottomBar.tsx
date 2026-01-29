'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { BlockType } from '@/types/block';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import './BottomBar.css';

const blockIcons: Record<BlockType, string> = {
  paragraph: 'T',
  heading: 'H',
  code: '</>',
  image: '🖼',
  video: '▶',
  list: '•',
  quote: '"',
  table: '⊞',
  divider: '—',
  page: '📄',
  pageBreak: '—',
};

export function BottomBar() {
  const selection = useEditorStore((state) => state.selection);
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const blocks = useEditorStore((state) => state.blocks);
  const insertBlock = useEditorStore((state) => state.insertBlock);
  const getBlockIndex = useEditorStore((state) => state.getBlockIndex);

  const handleInsertBlock = (type: BlockType) => {
    const currentIndex = focusedBlockId
      ? getBlockIndex(focusedBlockId)
      : blocks.length;
    const insertIndex = currentIndex === -1 ? blocks.length : currentIndex + 1;
    insertBlock(type, insertIndex);
  };

  const blockButtons: BlockType[] = [
    'paragraph',
    'heading',
    'list',
    'quote',
    'code',
    'image',
    'table',
    'divider',
  ];

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-content">
        {blockButtons.map((type) => (
          <IconButton
            key={type}
            icon={blockIcons[type]}
            label={type}
            onClick={() => handleInsertBlock(type)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

