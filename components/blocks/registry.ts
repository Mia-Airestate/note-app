import { BlockType } from '@/types/block';
import { Paragraph } from './Paragraph/Paragraph';
import { Heading } from './Heading/Heading';
import { CodeBlock } from './CodeBlock/CodeBlock';
import { ImageBlock } from './Image/Image';
import { ListBlock } from './List/List';
import { QuoteBlock } from './Quote/Quote';
import { TableBlock } from './Table/Table';
import { DividerBlock } from './Divider/Divider';

export interface BlockComponentProps {
  block: import('@/types/block').Block;
}

export const blockRegistry: Record<
  BlockType,
  {
    component: React.ComponentType<BlockComponentProps>;
    label: string;
    icon: string;
  }
> = {
  paragraph: {
    component: Paragraph,
    label: 'Text',
    icon: 'T',
  },
  heading: {
    component: Heading,
    label: 'Heading',
    icon: 'H',
  },
  code: {
    component: CodeBlock,
    label: 'Code',
    icon: '</>',
  },
  image: {
    component: ImageBlock,
    label: 'Image',
    icon: '🖼',
  },
  video: {
    component: ImageBlock,
    label: 'Video',
    icon: '▶',
  },
  list: {
    component: ListBlock,
    label: 'List',
    icon: '•',
  },
  quote: {
    component: QuoteBlock,
    label: 'Quote',
    icon: '"',
  },
  table: {
    component: TableBlock,
    label: 'Table',
    icon: '⊞',
  },
  divider: {
    component: DividerBlock,
    label: 'Divider',
    icon: '—',
  },
  page: {
    component: Paragraph,
    label: 'Page',
    icon: '📄',
  },
};

