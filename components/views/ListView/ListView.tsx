'use client';

import { usePageStore } from '@/stores/pageStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { groupPagesByDate } from '@/utils/dateGrouping';
import { highlightText } from '@/utils/highlightText';
import './ListView.css';
import { NoteItemFull } from '@/components/layout/Sidebar/NoteItemFull';

interface ListViewProps {
  searchQuery: string;
}

export function ListView({ searchQuery }: ListViewProps) {
  const pages = usePageStore((state) => state.pages);
  const setView = useNavigationStore((state) => state.setView);

  const filteredPages = searchQuery
    ? pages
        .filter((page) => {
          const titleMatch = page.title.toLowerCase().includes(searchQuery.toLowerCase());
          // Search in flowBlocks (new structure) or blocks (legacy)
          const contentMatch = (page.flowBlocks || page.blocks || []).some((block: any) =>
            block.content?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return titleMatch || contentMatch;
        })
        .sort((a, b) => {
          // Sort by relevance: exact title matches first, then by updatedAt
          const aTitleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
          const bTitleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          return b.updatedAt - a.updatedAt;
        })
    : pages;

  const groupedPages = searchQuery
    ? filteredPages.length > 0
      ? [{ label: `"${searchQuery}"`, pages: filteredPages }]
      : []
    : groupPagesByDate(filteredPages);

  const handleNoteClick = (noteId: string) => {
    setView('editor', noteId);
  };

  return (
    <div className="list-view">
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
                <p className="list-view-group-title">
                  {searchQuery ? highlightText(group.label, searchQuery) : group.label}
                </p>
                <div className="list-view-items">
                  {group.pages.map((page) => (
                    <div
                      key={page.id}
                      className="list-view-item"
                      onClick={() => handleNoteClick(page.id)}
                    >
                      <NoteItemFull
                        page={page}
                        isActive={false}
                        onClick={() => {}}
                        searchQuery={searchQuery}
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
