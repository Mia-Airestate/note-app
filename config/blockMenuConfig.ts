import { BlockType } from '@/types/block';
import { Selection } from '@/types/editor';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiLink,
  FiImage,
  FiPlay,
  FiList,
  FiCheckSquare,
  FiGrid,
  FiMinus,
  FiFile,
  FiType,
  FiHash,
  FiCode,
} from 'react-icons/fi';
import { TbStrikethrough, TbQuote } from 'react-icons/tb';
import { MdHighlight, MdFormatListNumbered } from 'react-icons/md';
import { HiCode } from 'react-icons/hi';

export type MenuItemCategory = 'blocks' | 'format' | 'actions';

export interface BlockMenuItem {
  id: string;
  label: string;
  icon: string | React.ComponentType<{ size?: number; className?: string }>;
  category: MenuItemCategory;
  blockType?: BlockType;
  slashCommands?: string[];
  shortcut?: string;
  showInSlashMenu: () => boolean;
  showInBottomBar: (selection: Selection | null) => boolean;
}

export const blockMenuItems: BlockMenuItem[] = [
  // Block Types - Category: 'blocks'
  {
    id: 'paragraph',
    label: 'Text',
    icon: FiType,
    category: 'blocks',
    blockType: 'paragraph',
    slashCommands: ['/text', '/p', '/paragraph'],
    showInSlashMenu: () => true,
    showInBottomBar: (selection) => selection?.type !== 'text',
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: FiHash,
    category: 'blocks',
    blockType: 'heading',
    slashCommands: ['/h1', '/h2', '/h3', '/h4', '/h5', '/h6', '/heading'],
    showInSlashMenu: () => true,
    showInBottomBar: (selection) => selection?.type !== 'text',
  },
  // {
  //   id: 'code',
  //   label: 'Code',
  //   icon: FiCode,
  //   category: 'blocks',
  //   blockType: 'code',
  //   slashCommands: ['/code', '/codeblock'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  {
    id: 'image',
    label: 'Image',
    icon: FiImage,
    category: 'blocks',
    blockType: 'image',
    slashCommands: ['/image', '/img'],
    showInSlashMenu: () => true,
    showInBottomBar: (selection) => selection?.type !== 'text',
  },
  // {
  //   id: 'video',
  //   label: 'Video',
  //   icon: FiPlay,
  //   category: 'blocks',
  //   blockType: 'video',
  //   slashCommands: ['/video'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  // {
  //   id: 'list',
  //   label: 'List',
  //   icon: FiList,
  //   category: 'blocks',
  //   blockType: 'list',
  //   slashCommands: ['/list', '/ul', '/bullet'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  // {
  //   id: 'checklist',
  //   label: 'Checklist',
  //   icon: FiCheckSquare,
  //   category: 'blocks',
  //   blockType: 'list',
  //   slashCommands: ['/checklist', '/todo', '/checkbox'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  // {
  //   id: 'ordered-list',
  //   label: 'Ordered List',
  //   icon: MdFormatListNumbered,
  //   category: 'blocks',
  //   blockType: 'list',
  //   slashCommands: ['/ol', '/ordered', '/numbered'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  // {
  //   id: 'quote',
  //   label: 'Quote',
  //   icon: TbQuote,
  //   category: 'blocks',
  //   blockType: 'quote',
  //   slashCommands: ['/quote', '/blockquote'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  // {
  //   id: 'table',
  //   label: 'Table',
  //   icon: FiGrid,
  //   category: 'blocks',
  //   blockType: 'table',
  //   slashCommands: ['/table'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },
  {
    id: 'divider',
    label: 'Divider',
    icon: FiMinus,
    category: 'blocks',
    blockType: 'divider',
    slashCommands: ['/divider', '/line', '/hr'],
    showInSlashMenu: () => true,
    showInBottomBar: (selection) => selection?.type !== 'text',
  },
  // {
  //   id: 'page',
  //   label: 'Page',
  //   icon: FiFile,
  //   category: 'blocks',
  //   blockType: 'page',
  //   slashCommands: ['/page', '/link'],
  //   showInSlashMenu: () => true,
  //   showInBottomBar: (selection) => selection?.type !== 'text',
  // },

  // Formatting - Category: 'format'
  {
    id: 'bold',
    label: 'Bold',
    icon: FiBold,
    category: 'format',
    shortcut: 'cmd+b',
    showInSlashMenu: () => false,
    showInBottomBar: (selection) => selection?.type === 'text',
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: FiItalic,
    category: 'format',
    shortcut: 'cmd+i',
    showInSlashMenu: () => false,
    showInBottomBar: (selection) => selection?.type === 'text',
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: FiUnderline,
    category: 'format',
    shortcut: 'cmd+u',
    showInSlashMenu: () => false,
    showInBottomBar: (selection) => selection?.type === 'text',
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    icon: TbStrikethrough,
    category: 'format',
    showInSlashMenu: () => false,
    showInBottomBar: (selection) => selection?.type === 'text',
  },
  // {
  //   id: 'highlight',
  //   label: 'Highlight',
  //   icon: MdHighlight,
  //   category: 'format',
  //   showInSlashMenu: () => false,
  //   showInBottomBar: (selection) => selection?.type === 'text',
  // },
  // {
  //   id: 'link',
  //   label: 'Link',
  //   icon: FiLink,
  //   category: 'format',
  //   shortcut: 'cmd+k',
  //   showInSlashMenu: () => false,
  //   showInBottomBar: (selection) => selection?.type === 'text',
  // },
  // {
  //   id: 'inline-code',
  //   label: 'Inline Code',
  //   icon: HiCode,
  //   category: 'format',
  //   shortcut: 'cmd+e',
  //   showInSlashMenu: () => false,
  //   showInBottomBar: (selection) => selection?.type === 'text',
  // },
];

// Helper functions to filter menu items
export function getSlashMenuItems(): BlockMenuItem[] {
  return blockMenuItems.filter((item) => item.showInSlashMenu());
}

export function getBottomBarItems(selection: Selection | null): BlockMenuItem[] {
  return blockMenuItems.filter((item) => item.showInBottomBar(selection));
}

export function getBottomBarBlockItems(selection: Selection | null = null): BlockMenuItem[] {
  return blockMenuItems.filter(
    (item) => item.category === 'blocks' && item.showInBottomBar(selection)
  );
}

export function getBottomBarFormatItems(selection: Selection | null): BlockMenuItem[] {
  return blockMenuItems.filter(
    (item) => item.category === 'format' && item.showInBottomBar(selection)
  );
}

export function findMenuItemBySlashCommand(command: string): BlockMenuItem | undefined {
  const normalizedCommand = command.toLowerCase().trim();
  return blockMenuItems.find((item) =>
    item.slashCommands?.some((cmd) => cmd.toLowerCase() === normalizedCommand)
  );
}

export function findMenuItemById(id: string): BlockMenuItem | undefined {
  return blockMenuItems.find((item) => item.id === id);
}

