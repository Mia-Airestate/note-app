import { InlineFormat } from '@/types/block';

/**
 * Apply formatting to a DOM element by wrapping text nodes with formatted elements
 */
export function applyFormatsToDOM(
  element: HTMLElement,
  content: string,
  formats: InlineFormat[]
) {
  if (!formats || formats.length === 0) {
    element.textContent = content;
    return;
  }

  // Clear existing content
  element.innerHTML = '';
  
  // Sort formats by start position
  const sortedFormats = [...formats].sort((a, b) => a.start - b.start);
  
  let currentPos = 0;
  const fragment = document.createDocumentFragment();
  
  for (const format of sortedFormats) {
    // Add text before this format
    if (format.start > currentPos) {
      const textNode = document.createTextNode(content.substring(currentPos, format.start));
      fragment.appendChild(textNode);
    }
    
    // Add formatted text
    const formatEnd = Math.min(format.end, content.length);
    const formattedText = content.substring(format.start, formatEnd);
    
    let formattedElement: HTMLElement | Text = document.createTextNode(formattedText);
    
    // Apply formatting
    switch (format.type) {
      case 'bold':
        const strong = document.createElement('strong');
        strong.textContent = formattedText;
        formattedElement = strong;
        break;
      case 'italic':
        const em = document.createElement('em');
        em.textContent = formattedText;
        formattedElement = em;
        break;
      case 'underline':
        const u = document.createElement('u');
        u.style.textDecoration = 'underline';
        u.textContent = formattedText;
        formattedElement = u;
        break;
      case 'strikethrough':
        const s = document.createElement('s');
        s.style.textDecoration = 'line-through';
        s.textContent = formattedText;
        formattedElement = s;
        break;
      case 'code':
        const code = document.createElement('code');
        code.style.background = 'rgba(0, 0, 0, 0.05)';
        code.style.padding = '2px 4px';
        code.style.borderRadius = '3px';
        code.style.fontFamily = 'monospace';
        code.style.fontSize = '0.9em';
        code.textContent = formattedText;
        formattedElement = code;
        break;
      case 'link':
        const a = document.createElement('a');
        a.href = format.data?.url || '#';
        a.style.color = '#007AFF';
        a.style.textDecoration = 'underline';
        a.textContent = formattedText;
        formattedElement = a;
        break;
      case 'highlight':
        const mark = document.createElement('mark');
        mark.style.background = 'rgba(255, 235, 59, 0.3)';
        mark.textContent = formattedText;
        formattedElement = mark;
        break;
    }
    
    fragment.appendChild(formattedElement);
    currentPos = formatEnd;
  }
  
  // Add remaining text
  if (currentPos < content.length) {
    const textNode = document.createTextNode(content.substring(currentPos));
    fragment.appendChild(textNode);
  }
  
  element.appendChild(fragment);
}

