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
  | 'page'
  | 'pageBreak'; // Manual page break marker

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ListType = 'ordered' | 'unordered' | 'checklist';

export interface InlineFormat {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight';
  start: number;
  end: number;
  data?: { url?: string };
}

export type LayoutMode = 'flow' | 'absolute';

export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

export interface BlockSize {
  width: number;
  height: number;
}

// Flow blocks: Semantic blocks that flow vertically (paragraphs, headings, lists)
export type FlowBlockType = 'paragraph' | 'heading' | 'list' | 'code' | 'quote' | 'table' | 'divider' | 'pageBreak';

export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  content: string;
  formats?: InlineFormat[];
  props?: {
    level?: HeadingLevel;
    listType?: ListType;
    language?: string;
    columns?: number;
    rows?: number;
    headers?: number[];
  };
  children?: FlowBlock[];
  indent?: number;
  pageBreak?: boolean; // Manual page break marker
}

// Floating objects: Absolutely positioned (images, text boxes, shapes)
export type FloatingObjectType = 'image' | 'textBox' | 'shape';

export interface FloatingObject {
  id: string;
  type: FloatingObjectType;
  position: BlockPosition;
  size: BlockSize;
  anchorBlockId?: string; // Optional: anchor to a flow block
  wrapMode?: 'none' | 'around' | 'square'; // Text wrapping behavior
  content: {
    src?: string; // For images
    alt?: string;
    caption?: string;
    text?: string; // For text boxes
  };
  zIndex?: number; // For layering
}

// Legacy Block type (for backward compatibility during migration)
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
    checked?: boolean;
  };
  children?: Block[];
  indent?: number;
  
  // Layout properties
  layoutMode?: LayoutMode; // Default: 'flow'
  position?: BlockPosition; // For 'absolute' blocks
  size?: BlockSize; // For 'absolute' blocks
  containerId?: string; // For 'flow' blocks - ID of parent container
  order?: number; // For 'flow' blocks - order within container
}

