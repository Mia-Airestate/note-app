/**
 * Apply visual formatting to contentEditable element using DOM manipulation
 * This ensures formatting is visible while editing
 */
export function applyVisualFormatting(
  element: HTMLElement,
  formatType: 'bold' | 'italic' | 'underline' | 'code',
  start: number,
  end: number
) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  
  // Use browser's built-in formatting commands
  document.execCommand(formatType === 'code' ? 'formatBlock' : formatType, false, undefined);
  
  // For code, wrap in <code> tag
  if (formatType === 'code') {
    try {
      const codeElement = document.createElement('code');
      codeElement.style.background = 'rgba(0, 0, 0, 0.05)';
      codeElement.style.padding = '2px 4px';
      codeElement.style.borderRadius = '3px';
      codeElement.style.fontFamily = 'monospace';
      codeElement.style.fontSize = '0.9em';
      
      range.surroundContents(codeElement);
    } catch (error) {
      // If surroundContents fails, try execCommand
      document.execCommand('formatBlock', false, 'code');
    }
  }
}

