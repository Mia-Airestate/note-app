'use client';

import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { groupPagesByDate } from '@/utils/dateGrouping';
import { NoteItem } from '@/components/layout/Sidebar/NoteItem';
import './ListView.css';

interface ListViewProps {
  searchQuery: string;
}

export function ListView({ searchQuery }: ListViewProps) {
  const pages = usePageStore((state) => state.pages);
  const setView = useNavigationStore((state) => state.setView);

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.blocks.some((block) =>
      block.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const groupedPages = searchQuery
    ? filteredPages.length > 0
      ? [{ label: 'Search Results', pages: filteredPages }]
      : []
    : groupPagesByDate(filteredPages);

  const handleNoteClick = (noteId: string) => {
    setView('editor', noteId);
  };

  return (
    <div className="list-view">
      <div className="list-view-header">
        <h1 className="list-view-title">Notes</h1>
        <p className="list-view-count">{pages.length} Notes</p>
      </div>
      <div className="list-view-content">
        {filteredPages.length === 0 ? (
          <div className="list-view-empty">
            <p className="text-secondary">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
          </div>
        ) : (
          <div className="list-view-groups">
            {groupedPages.map((group) => (
              <div key={group.label} className="list-view-group">
                <h2 className="list-view-group-title">{group.label}</h2>
                <div className="list-view-items">
                  {group.pages.map((page) => (
                    <div
                      key={page.id}
                      className="list-view-item"
                      onClick={() => handleNoteClick(page.id)}
                    >
                      <NoteItem
                        page={page}
                        isActive={false}
                        onClick={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
