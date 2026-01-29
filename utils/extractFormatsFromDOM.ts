import { InlineFormat } from '@/types/block';

/**
 * Extract formatting from DOM element by walking through and finding formatted nodes
 */
export function extractFormatsFromDOM(element: HTMLElement): InlineFormat[] {
  const formats: InlineFormat[] = [];
  const textContent = element.textContent || '';
  
  if (!textContent) return formats;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );
  
  let currentPos = 0;
  let node: Node | null;
  
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      currentPos += text.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || '';
      
      if (text) {
        const start = currentPos;
        const end = start + text.length;
        
        // Find the actual start position in the full text
        const beforeRange = document.createRange();
        beforeRange.selectNodeContents(element.parentElement || element);
        beforeRange.setEnd(element, 0);
        const actualStart = beforeRange.toString().length;
        const actualEnd = actualStart + text.length;
        
        switch (tagName) {
          case 'strong':
          case 'b':
            formats.push({ type: 'bold', start: actualStart, end: actualEnd });
            break;
          case 'em':
          case 'i':
            formats.push({ type: 'italic', start: actualStart, end: actualEnd });
            break;
          case 'u':
            formats.push({ type: 'underline', start: actualStart, end: actualEnd });
            break;
          case 's':
          case 'strike':
            formats.push({ type: 'strikethrough', start: actualStart, end: actualEnd });
            break;
          case 'code':
            formats.push({ type: 'code', start: actualStart, end: actualEnd });
            break;
          case 'a':
            const href = element.getAttribute('href') || '';
            formats.push({ type: 'link', start: actualStart, end: actualEnd, data: { url: href } });
            break;
          case 'mark':
            formats.push({ type: 'highlight', start: actualStart, end: actualEnd });
            break;
        }
      }
    }
  }
  
  return formats;
}

