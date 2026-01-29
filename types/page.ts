import { Block, FlowBlock, FloatingObject } from './block';

// Re-export for convenience
export type { FlowBlock, FloatingObject } from './block';

export interface Page {
  id: string;
  title: string;
  // New structure: separate flow blocks and floating objects
  flowBlocks: FlowBlock[];
  floatingObjects: FloatingObject[];
  // Legacy: keep blocks for backward compatibility during migration
  blocks?: Block[];
  createdAt: number;
  updatedAt: number;
}

