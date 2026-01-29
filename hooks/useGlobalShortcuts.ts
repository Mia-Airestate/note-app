import { useKeyboardShortcuts } from '@/utils/keyboardShortcuts';
import { saveCurrentNote, createNewPage } from '@/utils/noteActions';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';

/**
 * Hook for registering global keyboard shortcuts
 * These shortcuts work from anywhere in the app
 */
export function useGlobalShortcuts() {
  const currentView = useNavigationStore((state) => state.currentView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const setView = useNavigationStore((state) => state.setView);
  const createPage = usePageStore((state) => state.createPage);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);

  useKeyboardShortcuts(
    [
      {
        combo: 'cmd+n',
        handler: () => {
          createNewPage(createPage, setView);
        },
      },
      {
        combo: 'cmd+s',
        handler: () => {
          saveCurrentNote(currentView, selectedNoteId, blocks, getActivePage, updatePage);
        },
        enabled: currentView === 'editor' && selectedNoteId !== null,
      },
    ],
    [currentView, selectedNoteId, blocks, createPage, setView, getActivePage, updatePage]
  );
}

