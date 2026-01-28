import { Page } from '@/types/page';

export interface DateGroup {
  label: string;
  pages: Page[];
}

export function groupPagesByDate(pages: Page[]): DateGroup[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;

  const groups: DateGroup[] = [];
  const previous7Days: Page[] = [];
  const previous30Days: Page[] = [];
  const byYear: Record<number, Page[]> = {};

  pages.forEach((page) => {
    const diff = now - page.updatedAt;

    if (diff <= sevenDays) {
      previous7Days.push(page);
    } else if (diff <= thirtyDays) {
      previous30Days.push(page);
    } else {
      const year = new Date(page.updatedAt).getFullYear();
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(page);
    }
  });

  if (previous7Days.length > 0) {
    groups.push({ label: 'Previous 7 Days', pages: previous7Days });
  }

  if (previous30Days.length > 0) {
    groups.push({ label: 'Previous 30 Days', pages: previous30Days });
  }

  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  sortedYears.forEach((year) => {
    groups.push({ label: year.toString(), pages: byYear[year] });
  });

  return groups;
}

export function formatNoteDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    }
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  if (year === currentYear) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${year}`;
}

export function getNotePreview(blocks: Page['blocks']): string {
  for (const block of blocks) {
    if (block.content && block.content.trim()) {
      return block.content.trim().substring(0, 100);
    }
  }
  return '';
}

