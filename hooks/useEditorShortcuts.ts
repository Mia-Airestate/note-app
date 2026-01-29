import { useKeyboardShortcuts } from '@/utils/keyboardShortcuts';
import { saveCurrentNote } from '@/utils/noteActions';
import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';

/**
 * Hook for registering editor-specific keyboard shortcuts
 * These shortcuts only work when the editor is active
 */
export function useEditorShortcuts() {
  const currentView = useNavigationStore((state) => state.currentView);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const goBack = useNavigationStore((state) => state.goBack);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);

  useKeyboardShortcuts(
    [
      {
        combo: 'escape',
        handler: () => {
          saveCurrentNote(currentView, selectedNoteId, blocks, getActivePage, updatePage);
          goBack();
        },
        enabled: selectedNoteId !== null,
      },
    ],
    [currentView, selectedNoteId, blocks, getActivePage, updatePage, goBack]
  );
}

