'use client';

import { blockRegistry } from '@/components/blocks/registry';
import { Menu } from '@/components/ui/Menu/Menu';
import { BlockType } from '@/types/block';
import './SlashMenu.css';

interface SlashMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onSelect: (type: BlockType) => void;
}

export function SlashMenu({ isOpen, position, onSelect }: SlashMenuProps) {
  if (!isOpen || !position) return null;

  const menuItems = Object.entries(blockRegistry)
    .filter(([type]) => type !== 'page')
    .map(([type, config]) => ({
      id: type,
      label: config.label,
      icon: config.icon,
      onClick: () => onSelect(type as BlockType),
    }));

  return (
    <div
      className="slash-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <Menu items={menuItems} />
    </div>
  );
}

