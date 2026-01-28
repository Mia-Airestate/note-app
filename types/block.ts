export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'code'
  | 'image'
  | 'video'
  | 'list'
  | 'quote'
  | 'table'
  | 'divider'
  | 'page';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ListType = 'ordered' | 'unordered' | 'checklist';

export interface InlineFormat {
  type: 'bold' | 'italic' | 'code' | 'link';
  start: number;
  end: number;
  data?: { url?: string };
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  formats?: InlineFormat[];
  props?: {
    level?: HeadingLevel;
    listType?: ListType;
    language?: string;
    src?: string;
    alt?: string;
    caption?: string;
    columns?: number;
    rows?: number;
    headers?: number[];
  };
  children?: Block[];
  indent?: number;
}

