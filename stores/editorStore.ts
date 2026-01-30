import { create } from 'zustand';
import { Block, BlockType } from '@/types/block';
import { Selection } from '@/types/editor';
import { generateId } from '@/utils/id';

interface EditorState {
  blocks: Block[];
  selection: Selection | null;
  focusedBlockId: string | null;
  caretPosition: number | null;
  viewMode: 'note' | 'markdown';
  setBlocks: (blocks: Block[]) => void;
  setSelection: (selection: Selection | null) => void;
  setFocusedBlock: (id: string | null) => void;
  setCaretPosition: (position: number | null) => void;
  setViewMode: (mode: 'note' | 'markdown') => void;
  insertBlock: (
    type: BlockType,
    position: number,
    props?: Block['props']
  ) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, newPosition: number) => void;
  getBlock: (id: string) => Block | undefined;
  getBlockIndex: (id: string) => number;
}

const createBlock = (
  type: BlockType,
  content: string = '',
  props?: Block['props']
): Block => ({
  id: generateId(),
  type,
  content,
  props,
});

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  selection: null,
  focusedBlockId: null,
  caretPosition: null,
  viewMode: 'note',

  setBlocks: (blocks) => set({ blocks }),

  setSelection: (selection) => set({ selection }),

  setFocusedBlock: (id) => set({ focusedBlockId: id }),

  setCaretPosition: (position) => set({ caretPosition: position }),

  setViewMode: (mode) => set({ viewMode: mode }),

  insertBlock: (type, position, props) => {
    const newBlock = createBlock(type, '', props);
    set((state) => {
      const newBlocks = [...state.blocks];
      newBlocks.splice(position, 0, newBlock);
      return {
        blocks: newBlocks,
        focusedBlockId: newBlock.id,
        caretPosition: 0,
      };
    });
  },

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    })),

  deleteBlock: (id) =>
    set((state) => {
      const filtered = state.blocks.filter((block) => block.id !== id);
      const newFocusedId =
        state.focusedBlockId === id
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.focusedBlockId;
      return {
        blocks: filtered,
        focusedBlockId: newFocusedId,
        selection: null,
      };
    }),

  moveBlock: (id, newPosition) =>
    set((state) => {
      const currentIndex = state.blocks.findIndex((b) => b.id === id);
      if (currentIndex === -1 || currentIndex === newPosition) return state;

      const newBlocks = [...state.blocks];
      const [block] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(newPosition, 0, block);
      return { blocks: newBlocks };
    }),

  getBlock: (id) => {
    const state = get();
    return state.blocks.find((block) => block.id === id);
  },

  getBlockIndex: (id) => {
    const state = get();
    return state.blocks.findIndex((block) => block.id === id);
  },
}));

