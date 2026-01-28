import { Page } from '@/types/page';
import { Block } from '@/types/block';
import { generateId } from '@/utils/id';

/**
 * Extracts the title from a page.
 * Looks for the first heading block, otherwise uses the page title or "Untitled"
 */
export function getNoteTitle(page: Page): string {
  if (!page || !page.blocks || page.blocks.length === 0) {
    return page?.title || 'Untitled';
  }

  // Find first heading block
  const headingBlock = page.blocks.find(
    (block) => block.type === 'heading' && block.content.trim()
  );

  if (headingBlock && headingBlock.content.trim()) {
    return headingBlock.content.trim();
  }

  // Fallback to page title or first non-empty block content
  if (page.title && page.title !== 'Untitled') {
    return page.title;
  }

  const firstContentBlock = page.blocks.find(
    (block) => block.content && block.content.trim()
  );

  if (firstContentBlock && firstContentBlock.content.trim()) {
    // Use first 50 chars as title
    return firstContentBlock.content.trim().substring(0, 50);
  }

  return 'Untitled';
}

/**
 * Converts a page to markdown format for easy migration to database
 */
export function pageToMarkdown(page: Page): string {
  const lines: string[] = [];
  
  // Add title as frontmatter or first heading
  lines.push(`# ${page.title || 'Untitled'}\n`);

  // Convert blocks to markdown
  page.blocks.forEach((block) => {
    switch (block.type) {
      case 'heading':
        const level = block.props?.level || 1;
        const prefix = '#'.repeat(level);
        lines.push(`${prefix} ${block.content}`);
        break;
      
      case 'paragraph':
        if (block.content.trim()) {
          lines.push(block.content);
        }
        break;
      
      case 'code':
        const language = block.props?.language || '';
        lines.push(`\`\`\`${language}`);
        lines.push(block.content);
        lines.push('```');
        break;
      
      case 'list':
        const listType = block.props?.listType || 'unordered';
        if (block.children && block.children.length > 0) {
          block.children.forEach((child, index) => {
            const prefix = listType === 'ordered' ? `${index + 1}. ` : '- ';
            lines.push(`${prefix}${child.content}`);
          });
        } else if (block.content) {
          const prefix = listType === 'ordered' ? '1. ' : '- ';
          lines.push(`${prefix}${block.content}`);
        }
        break;
      
      case 'quote':
        lines.push(`> ${block.content}`);
        break;
      
      case 'divider':
        lines.push('---');
        break;
      
      case 'image':
        const alt = block.props?.alt || '';
        const src = block.props?.src || '';
        lines.push(`![${alt}](${src})`);
        break;
      
      default:
        if (block.content) {
          lines.push(block.content);
        }
    }
    lines.push(''); // Add blank line between blocks
  });

  return lines.join('\n').trim();
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
    blocks: blocks.length > 0 ? blocks : [{
      id: generateId(),
      type: 'paragraph',
      content: '',
    }],
    createdAt: now,
    updatedAt: now,
  };
}

