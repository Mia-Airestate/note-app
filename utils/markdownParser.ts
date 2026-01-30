import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { Block, InlineFormat } from '@/types/block';
import { generateId } from '@/utils/id';

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  depth?: number;
  lang?: string;
  url?: string;
  alt?: string;
  title?: string;
  ordered?: boolean;
  start?: number;
  checked?: boolean;
};

/**
 * Parse markdown string into Block array
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
  if (!markdown || markdown.trim() === '') {
    return [];
  }

  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown);
  const blocks: Block[] = [];

  // Track list state for nested lists
  let currentListBlock: Block | null = null;
  let listDepth = 0;

  const processNode = (node: MarkdownNode, parentIndent: number = 0): void => {
    switch (node.type) {
      case 'heading':
        blocks.push({
          id: generateId(),
          type: 'heading',
          content: extractText(node),
          formats: extractFormats(node),
          props: {
            level: (node.depth || 1) as 1 | 2 | 3 | 4 | 5 | 6,
          },
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'paragraph':
        // If we're inside a list, add to list block
        if (currentListBlock && listDepth > 0) {
          // Add as list item content
          const text = extractText(node);
          if (text.trim()) {
            // For now, treat as separate paragraph after list
            currentListBlock = null;
            blocks.push({
              id: generateId(),
              type: 'paragraph',
              content: text,
              formats: extractFormats(node),
              indent: parentIndent,
            });
          }
        } else {
          blocks.push({
            id: generateId(),
            type: 'paragraph',
            content: extractText(node),
            formats: extractFormats(node),
            indent: parentIndent,
          });
        }
        break;

      case 'code':
        blocks.push({
          id: generateId(),
          type: 'code',
          content: node.value || '',
          props: {
            language: 'plaintext',
          },
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'codeBlock':
        blocks.push({
          id: generateId(),
          type: 'code',
          content: extractText(node),
          props: {
            language: node.lang || 'plaintext',
          },
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'blockquote':
        blocks.push({
          id: generateId(),
          type: 'quote',
          content: extractText(node),
          formats: extractFormats(node),
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'image':
        blocks.push({
          id: generateId(),
          type: 'image',
          content: '',
          props: {
            src: node.url || '',
            alt: node.alt || '',
          },
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'list':
        listDepth++;
        const listType = node.ordered ? 'ordered' : 'unordered';
        
        // Process list items
        if (node.children) {
          for (const child of node.children) {
            if (child.type === 'listItem') {
              const checked = child.checked;
              const itemType = checked !== undefined ? 'checklist' : listType;
              
              // Extract text from list item
              const itemText = extractText(child);
              
              blocks.push({
                id: generateId(),
                type: 'list',
                content: itemText,
                formats: extractFormats(child),
                props: {
                  listType: itemType,
                },
                indent: parentIndent,
              });
            }
          }
        }
        listDepth--;
        currentListBlock = null;
        break;

      case 'thematicBreak':
        blocks.push({
          id: generateId(),
          type: 'divider',
          content: '',
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      case 'table':
        // TODO: Handle table parsing
        blocks.push({
          id: generateId(),
          type: 'table',
          content: '',
          props: {
            columns: node.children?.[0]?.children?.length || 0,
            rows: (node.children?.length || 1) - 1, // Subtract header row
          },
          indent: parentIndent,
        });
        currentListBlock = null;
        break;

      default:
        // Process children recursively
        if (node.children) {
          for (const child of node.children) {
            processNode(child, parentIndent);
          }
        }
        break;
    }
  };

  // Process the AST
  if (tree.children) {
    for (const child of tree.children) {
      processNode(child as MarkdownNode);
    }
  }

  // If no blocks were created, create an empty paragraph
  if (blocks.length === 0) {
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      content: '',
    });
  }

  return blocks;
}

/**
 * Extract plain text from a markdown node, stripping HTML tags
 */
function extractText(node: MarkdownNode): string {
  if (node.value) {
    // If it's an HTML node, extract text content from HTML
    if (node.type === 'html') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = node.value;
      return tempDiv.textContent || '';
    }
    // If it's a text node, check for HTML tags and strip them
    if (node.type === 'text') {
      const textValue = node.value;
      // Check if text contains HTML tags
      if (textValue.includes('<') && textValue.includes('>')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = textValue;
        return tempDiv.textContent || textValue;
      }
      return textValue;
    }
    return node.value;
  }

  if (node.children) {
    return node.children
      .map((child) => {
        if (child.type === 'text') {
          const textValue = child.value || '';
          // Check if text contains HTML tags and strip them
          if (textValue.includes('<') && textValue.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = textValue;
            return tempDiv.textContent || textValue;
          }
          return textValue;
        }
        if (child.type === 'inlineCode') {
          return child.value || '';
        }
        if (child.type === 'html') {
          // Extract text content from HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = child.value || '';
          return tempDiv.textContent || '';
        }
        return extractText(child);
      })
      .join('');
  }

  return '';
}

/**
 * Extract inline formatting from a markdown node
 */
function extractFormats(node: MarkdownNode): InlineFormat[] {
  const formats: InlineFormat[] = [];
  let position = 0;

  const processInlineNode = (n: MarkdownNode, offset: number = 0): void => {
    if (n.type === 'text') {
      const textValue = n.value || '';
      // Check if text contains HTML tags like <u>text</u>
      const htmlTagRegex = /<(u|s|strike|strong|b|em|i|code|a|mark)([^>]*)>(.*?)<\/\1>/gi;
      let match;
      let lastIndex = 0;
      let textLength = 0;
      
      while ((match = htmlTagRegex.exec(textValue)) !== null) {
        const [fullMatch, tagName, attrs, textContent] = match;
        const tagStart = match.index;
        
        // Add text before the HTML tag
        if (tagStart > lastIndex) {
          const beforeText = textValue.substring(lastIndex, tagStart);
          textLength += beforeText.length;
        }
        
        // Calculate format position
        const start = position + textLength;
        const end = start + textContent.length;
        textLength += textContent.length;
        
        const tagLower = tagName.toLowerCase();
        switch (tagLower) {
          case 'u':
            formats.push({ type: 'underline', start, end });
            break;
          case 's':
          case 'strike':
            formats.push({ type: 'strikethrough', start, end });
            break;
          case 'strong':
          case 'b':
            formats.push({ type: 'bold', start, end });
            break;
          case 'em':
          case 'i':
            formats.push({ type: 'italic', start, end });
            break;
          case 'code':
            formats.push({ type: 'code', start, end });
            break;
          case 'a':
            const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
            const url = hrefMatch ? hrefMatch[1] : '#';
            formats.push({ type: 'link', start, end, data: { url } });
            break;
          case 'mark':
            formats.push({ type: 'highlight', start, end });
            break;
        }
        
        lastIndex = match.index + fullMatch.length;
      }
      
      // Add remaining text after last HTML tag
      if (lastIndex < textValue.length) {
        const afterText = textValue.substring(lastIndex);
        textLength += afterText.length;
      }
      
      position += textLength;
      return;
    }

    // Handle HTML nodes (raw HTML in markdown)
    if (n.type === 'html' && n.value) {
      const htmlValue = n.value;
      // Parse HTML tags like <u>text</u>, <s>text</s>, etc.
      const htmlTagMatch = htmlValue.match(/^<(\w+)([^>]*)>(.*?)<\/\1>$/);
      if (htmlTagMatch) {
        const [, tagName, attrs, textContent] = htmlTagMatch;
        const start = position;
        const end = start + textContent.length;
        
        const tagLower = tagName.toLowerCase();
        switch (tagLower) {
          case 'u':
            formats.push({ type: 'underline', start, end });
            break;
          case 's':
          case 'strike':
            formats.push({ type: 'strikethrough', start, end });
            break;
          case 'strong':
          case 'b':
            formats.push({ type: 'bold', start, end });
            break;
          case 'em':
          case 'i':
            formats.push({ type: 'italic', start, end });
            break;
          case 'code':
            formats.push({ type: 'code', start, end });
            break;
          case 'a':
            const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
            const url = hrefMatch ? hrefMatch[1] : '#';
            formats.push({ type: 'link', start, end, data: { url } });
            break;
          case 'mark':
            formats.push({ type: 'highlight', start, end });
            break;
        }
        
        position = end;
        return;
      } else {
        // If it's not a simple tag, extract text content from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlValue;
        const textContent = tempDiv.textContent || '';
        position += textContent.length;
        return;
      }
    }

    if (n.type === 'strong' || n.type === 'emphasis') {
      const text = extractText(n);
      const start = position;
      const end = start + text.length;

      if (n.type === 'strong') {
        formats.push({
          type: 'bold',
          start,
          end,
        });
      } else {
        formats.push({
          type: 'italic',
          start,
          end,
        });
      }

      if (n.children) {
        for (const child of n.children) {
          processInlineNode(child, offset);
        }
      }
      position = end;
      return;
    }

    if (n.type === 'delete') {
      const text = extractText(n);
      const start = position;
      const end = start + text.length;
      formats.push({
        type: 'strikethrough',
        start,
        end,
      });
      position = end;
      return;
    }

    if (n.type === 'inlineCode') {
      const text = n.value || '';
      const start = position;
      const end = start + text.length;
      formats.push({
        type: 'code',
        start,
        end,
      });
      position = end;
      return;
    }

    if (n.type === 'link') {
      const text = extractText(n);
      const start = position;
      const end = start + text.length;
      formats.push({
        type: 'link',
        start,
        end,
        data: {
          url: n.url || '#',
        },
      });
      position = end;
      return;
    }

    if (n.children) {
      for (const child of n.children) {
        processInlineNode(child, offset);
      }
    }
  };

  if (node.children) {
    for (const child of node.children) {
      processInlineNode(child);
    }
  }

  return formats;
}

