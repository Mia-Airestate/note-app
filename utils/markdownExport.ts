import { Block, BlockType, HeadingLevel, ListType } from '@/types/block';
import { Page } from '@/types/page';

/**
 * Convert a Page to markdown string
 */
export function exportPageToMarkdown(page: Page): string {
  const lines: string[] = [];

  // Use flowBlocks (new structure) or blocks (legacy)
  const blocks = page.flowBlocks || page.blocks || [];
  for (const block of blocks as Block[]) {
    const markdown = serializeBlock(block);
    if (markdown) {
      lines.push(...markdown);
    }
  }

  return lines.join('\n');
}

/**
 * Serialize a single block to markdown lines
 */
function serializeBlock(block: Block): string[] {
  const lines: string[] = [];

  switch (block.type) {
    case 'paragraph':
      if (block.content) {
        lines.push(applyInlineFormats(block.content, block.formats));
      }
      break;

    case 'heading':
      const level = block.props?.level || 1;
      const headingPrefix = '#'.repeat(level);
      if (block.content) {
        lines.push(
          `${headingPrefix} ${applyInlineFormats(block.content, block.formats)}`
        );
      }
      break;

    case 'code':
      const language = block.props?.language || 'plaintext';
      lines.push('```' + language);
      if (block.content) {
        lines.push(block.content);
      }
      lines.push('```');
      break;

    case 'image':
      const alt = block.props?.alt || '';
      const src = block.props?.src || '';
      if (src) {
        lines.push(`![${alt}](${src})`);
      }
      break;

    case 'video':
      const videoSrc = block.props?.src || '';
      if (videoSrc) {
        lines.push(`<video src="${videoSrc}"></video>`);
      }
      break;

    case 'list':
      const listType = block.props?.listType || 'unordered';
      if (block.content) {
        const prefix = listType === 'ordered' ? '1.' : listType === 'checklist' ? '- [ ]' : '-';
        lines.push(`${prefix} ${applyInlineFormats(block.content, block.formats)}`);
      }
      break;

    case 'quote':
      if (block.content) {
        lines.push(`> ${applyInlineFormats(block.content, block.formats)}`);
      }
      break;

    case 'table':
      // TODO: Implement table serialization
      lines.push('<!-- Table -->');
      break;

    case 'divider':
      lines.push('---');
      break;

    case 'page':
      const pageTitle = block.content || 'Untitled';
      lines.push(`[[${pageTitle}]]`);
      break;
  }

  return lines;
}

/**
 * Apply inline formatting to text content
 */
function applyInlineFormats(content: string, formats?: Block['formats']): string {
  if (!formats || formats.length === 0) {
    return content;
  }

  // Sort formats by start position
  const sortedFormats = [...formats].sort((a, b) => a.start - b.start);

  // Build array of segments with formatting
  const segments: Array<{ text: string; formats: typeof formats }> = [];
  let currentPos = 0;

  for (const format of sortedFormats) {
    // Add text before this format
    if (format.start > currentPos) {
      segments.push({
        text: content.substring(currentPos, format.start),
        formats: [],
      });
    }

    // Add formatted text
    const formatEnd = Math.min(format.end, content.length);
    segments.push({
      text: content.substring(format.start, formatEnd),
      formats: [format],
    });

    currentPos = formatEnd;
  }

  // Add remaining text
  if (currentPos < content.length) {
    segments.push({
      text: content.substring(currentPos),
      formats: [],
    });
  }

  // Apply formatting marks
  return segments
    .map((segment) => {
      let text = segment.text;

      for (const format of segment.formats || []) {
        switch (format.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'strikethrough':
            text = `~~${text}~~`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'link':
            const url = format.data?.url || '#';
            text = `[${text}](${url})`;
            break;
          case 'highlight':
            text = `==${text}==`;
            break;
        }
      }

      return text;
    })
    .join('');
}

/**
 * Download page as markdown file
 */
export function downloadPageAsMarkdown(page: Page): void {
  const markdown = exportPageToMarkdown(page);
  const filename = `${page.title || 'Untitled'}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

