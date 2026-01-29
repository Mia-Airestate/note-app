import { Page } from '@/types/page';
import { Block } from '@/types/block';

/**
 * Save the current note if one is open and has content
 * Returns true if save was successful, false otherwise
 */
export function saveCurrentNote(
  currentView: 'list' | 'editor',
  selectedNoteId: string | null,
  blocks: Block[],
  getActivePage: () => Page | null,
  updatePage: (id: string, updates: Partial<Page>) => void
): boolean {
  if (currentView === 'editor' && selectedNoteId && blocks.length > 0) {
    const activePage = getActivePage();
    if (activePage) {
      updatePage(selectedNoteId, { blocks });
      return true;
    }
  }
  return false;
}

/**
 * Create a new page and navigate to it
 */
export function createNewPage(
  createPage: () => Page,
  setView: (view: 'list' | 'editor', noteId?: string | null) => void
): Page {
  const newPage = createPage();
  setView('editor', newPage.id);
  return newPage;
}

