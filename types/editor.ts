import { Block } from './block';

export type SelectionType = 'text' | 'block' | null;

export interface TextSelection {
  type: 'text';
  blockId: string;
  start: number;
  end: number;
}

export interface BlockSelection {
  type: 'block';
  blockId: string;
  includeChildren?: boolean;
}

export type Selection = TextSelection | BlockSelection | null;

export interface EditorState {
  blocks: Block[];
  selection: Selection;
  focusedBlockId: string | null;
  caretPosition: number | null;
}

