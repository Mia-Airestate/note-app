'use client';

import { Block } from '@/types/block';
import { blockRegistry } from './registry';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/stores/editorStore';
import './BlockWrapper.css';

interface BlockWrapperProps {
  block: Block;
}

export function BlockWrapper({ block }: BlockWrapperProps) {
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId);
  const setFocusedBlock = useEditorStore((state) => state.setFocusedBlock);
  const selection = useEditorStore((state) => state.selection);

  const isFocused = focusedBlockId === block.id;
  const isSelected =
    selection?.type === 'block' && selection.blockId === block.id;

  const BlockComponent = blockRegistry[block.type]?.component;

  if (!BlockComponent) {
    return (
      <div className="block-container">
        <div className="block-error">Unknown block type: {block.type}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'block-container',
        isFocused && 'block-focused',
        isSelected && 'block-selected'
      )}
      onClick={() => setFocusedBlock(block.id)}
    >
      <div className="block-handle" />
      <BlockComponent block={block} />
    </div>
  );
}

