'use client';

import { useNavigationStore } from '@/stores/navigationStore';
import { usePageStore } from '@/stores/pageStore';
import { useEditorStore } from '@/stores/editorStore';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiChevronLeft, FiShare2, FiMoreHorizontal, FiCheck } from 'react-icons/fi';
import './TopBar.css';

export function TopBar() {
  const currentView = useNavigationStore((state) => state.currentView);
  const goBack = useNavigationStore((state) => state.goBack);
  const selectedNoteId = useNavigationStore((state) => state.selectedNoteId);
  const getActivePage = usePageStore((state) => state.getActivePage);
  const updatePage = usePageStore((state) => state.updatePage);
  const blocks = useEditorStore((state) => state.blocks);

  const activePage =
    selectedNoteId && currentView === 'editor' ? getActivePage() : null;

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share note');
  };

  const handleMore = () => {
    // TODO: Implement more options menu
    console.log('More options');
  };

  const handleDone = () => {
    if (activePage && selectedNoteId && blocks.length > 0) {
      updatePage(selectedNoteId, { blocks });
    }
    goBack();
  };

  if (currentView === 'list') {
    return null;
  }

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <GlassButton
          icon={FiChevronLeft}
          onClick={goBack}
          ariaLabel="Back"
        />
        {activePage && (
          <div className="top-bar-title">{activePage.title}</div>
        )}
      </div>
      <div className="top-bar-right">
        <GlassButton
          icon={FiShare2}
          onClick={handleShare}
          ariaLabel="Share"
        />
        <GlassButton
          icon={FiMoreHorizontal}
          onClick={handleMore}
          ariaLabel="More options"
        />
        <GlassButton
          icon={FiCheck}
          onClick={handleDone}
          variant="primary"
          ariaLabel="Done"
          className="top-bar-done"
        />
      </div>
    </div>
  );
}
