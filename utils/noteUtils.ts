import { Page } from '@/types/page';
import { Block } from '@/types/block';
import { generateId } from '@/utils/id';
import { parseMarkdownToBlocks } from '@/utils/markdownParser';

/**
 * Extracts the title from a page.
 * Looks for the first heading block in markdown, otherwise uses the page title or "Untitled"
 */
export function getNoteTitle(page: Page): string {
  if (!page) {
    return 'Untitled';
  }

  // Parse markdown to find first heading
  if (page.markdown) {
    const blocks = parseMarkdownToBlocks(page.markdown);
    const headingBlock = blocks.find(
      (block) => block.type === 'heading' && block.content?.trim()
    );

    if (headingBlock && headingBlock.content.trim()) {
      return headingBlock.content.trim();
    }

    // Fallback to first non-empty block content
    const firstContentBlock = blocks.find(
      (block) => block.content && block.content.trim()
    );

    if (firstContentBlock && firstContentBlock.content.trim()) {
      // Use first 50 chars as title
      return firstContentBlock.content.trim().substring(0, 50);
    }
  }

  // Fallback to page title
  return page.title || 'Untitled';
}

/**
 * Converts a page to markdown format
 * Now just returns the markdown field directly
 */
export function pageToMarkdown(page: Page): string {
  return page.markdown || '';
}

/**
 * Parses markdown back to a Page object
 * Note: This is a basic implementation. For production, consider using a markdown parser library
 */
export function markdownToPage(markdown: string, id?: string): Page {
  const now = Date.now();
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        blocks.push({
          id: generateId(),
          type: 'heading',
          content: match[2],
          props: { level },
        });
      }
      i++;
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: generateId(),
        type: 'code',
        content: codeLines.join('\n'),
        props: { language },
      });
      i++;
      continue;
    }

    // Quote
    if (line.startsWith('>')) {
      blocks.push({
        id: generateId(),
        type: 'quote',
        content: line.substring(1).trim(),
      });
      i++;
      continue;
    }

    // Divider
    if (line.match(/^-{3,}$/)) {
      blocks.push({
        id: generateId(),
        type: 'divider',
        content: '',
      });
      i++;
      continue;
    }

    // List item
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      const listType = line.match(/^\d+\.\s+/) ? 'ordered' : 'unordered';
      const content = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
      blocks.push({
        id: generateId(),
        type: 'list',
        content,
        props: { listType },
      });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      content: line,
    });
    i++;
  }

  // Extract title from first heading or use first line
  let title = 'Untitled';
  const firstHeading = blocks.find((b) => b.type === 'heading');
  if (firstHeading) {
    title = firstHeading.content;
  } else if (blocks.length > 0 && blocks[0].content) {
    title = blocks[0].content.substring(0, 50);
  }

  return {
    id: id || generateId(),
    title,
    markdown,
    createdAt: now,
    updatedAt: now,
  };
}

