'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Block } from '@/types/block';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { useBlockNavigation } from '@/hooks/useBlockNavigation';
import { useEditorStore } from '@/stores/editorStore';
import { toggleFormat, applyFormat } from '@/utils/formatText';
import { renderFormattedText } from '@/utils/renderFormattedText';
import { applyVisualFormatting } from '@/utils/applyVisualFormatting';
import { applyFormatsToDOM } from '@/utils/applyFormatsToDOM';
import { extractFormatsFromDOM } from '@/utils/extractFormatsFromDOM';
import { CustomCaret } from '@/components/ui/CustomCaret/CustomCaret';
import './EditableBlock.css';

interface EditableBlockProps {
  block: Block;
  onOpenSlashMenu?: (position: { top: number; left: number }) => void;
  onCreateBlockAfter?: () => void;
  onArrowNavigation?: (
    blockId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    cursorPos: number,
    content: string
  ) => boolean;
  className?: string;
  placeholder?: string;
}

export function EditableBlock({
  block,
  onOpenSlashMenu,
  onCreateBlockAfter,
  onArrowNavigation,
  className = '',
  placeholder = '',
}: EditableBlockProps) {
  const [content, setContent] = useState(block.content || '');
  const [isFocused, setIsFocused] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { updateBlock, deleteBlock, addBlock } = useBlockEditor();
  const { handleArrowNavigation } = useBlockNavigation();
  const setSelection = useEditorStore((state) => state.setSelection);
  const lastBlockIdRef = useRef<string>(block.id);

  // Sync content when block changes externally and apply formatting
  useEffect(() => {
    if (block.id !== lastBlockIdRef.current) {
      lastBlockIdRef.current = block.id;
      setContent(block.content || '');
      if (contentRef.current) {
        // Apply formatting if available
        if (block.formats && block.formats.length > 0) {
          applyFormatsToDOM(contentRef.current, block.content || '', block.formats);
        } else {
          contentRef.current.textContent = block.content || '';
        }
      }
    } else if (!isFocused && (block.content !== content || JSON.stringify(block.formats) !== JSON.stringify(block.formats))) {
      setContent(block.content || '');
      if (contentRef.current) {
        // Apply formatting if available
        if (block.formats && block.formats.length > 0) {
          applyFormatsToDOM(contentRef.current, block.content || '', block.formats);
        } else {
          contentRef.current.textContent = block.content || '';
        }
      }
    }
  }, [block.id, block.content, block.formats, isFocused, content]);

  // Auto-adjust height
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Track text selection - with debouncing to prevent double-tap issues
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleSelectionChange = () => {
      // Debounce selection changes to prevent rapid fire updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || !contentRef.current) {
          setSelection(null);
          return;
        }

        // Check if selection is within this block
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Check if selection is within this block's content
          const isWithinBlock = 
            contentRef.current.contains(range.startContainer) ||
            contentRef.current.contains(range.endContainer) ||
            range.startContainer === contentRef.current ||
            range.endContainer === contentRef.current;
            
          if (isWithinBlock) {
            if (!selection.isCollapsed) {
              // Text is selected
              try {
                const preRange = range.cloneRange();
                preRange.selectNodeContents(contentRef.current);
                preRange.setEnd(range.startContainer, range.startOffset);
                const start = preRange.toString().length;
                const end = start + range.toString().length;

                setSelection({
                  type: 'text',
                  blockId: block.id,
                  start,
                  end,
                });
              } catch (error) {
                // Selection might be invalid, ignore
                setSelection(null);
              }
            } else {
              // No selection, just caret
              setSelection(null);
            }
          } else {
            // Selection is outside this block
            setSelection(null);
          }
        } else {
          setSelection(null);
        }
      }, 10); // Small debounce to prevent double-tap issues
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [block.id, setSelection]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const value = e.currentTarget.textContent || '';
      setContent(value);
      
      // Extract formats from DOM to preserve them when user types
      if (contentRef.current) {
        const extractedFormats = extractFormatsFromDOM(contentRef.current);
        updateBlock(block.id, { content: value, formats: extractedFormats });
      } else {
        updateBlock(block.id, { content: value });
      }

      // Auto-adjust height
      if (contentRef.current) {
        contentRef.current.style.height = 'auto';
        contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
      }
    },
    [block.id, updateBlock]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !contentRef.current) return;

    const range = selection.getRangeAt(0);
    const pastedHtml = e.clipboardData.getData('text/html');
    const pastedText = e.clipboardData.getData('text/plain');
    
    // Check if pasted content is a URL
    const urlPattern = /^https?:\/\/.+/;
    const isUrl = urlPattern.test(pastedText.trim());
    
    if (isUrl && !selection.isCollapsed) {
      // If text is selected and pasted content is a URL, create a link
      const preRange = range.cloneRange();
      preRange.selectNodeContents(contentRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + range.toString().length;
      
      // Apply link format
      const newFormats = applyFormat(block.formats, start, end, 'link', { url: pastedText.trim() });
      updateBlock(block.id, { formats: newFormats });
      
      // Don't insert the URL text, just format the selection
      return;
    } else if (isUrl && selection.isCollapsed) {
      // If no selection and pasted content is a URL, insert as link
      const preRange = range.cloneRange();
      preRange.selectNodeContents(contentRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + pastedText.length;
      
      // Insert text and apply link format
      range.deleteContents();
      const textNode = document.createTextNode(pastedText);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Update content and apply link format
      const newContent = contentRef.current.textContent || '';
      const newFormats = applyFormat(block.formats, start, end, 'link', { url: pastedText.trim() });
      updateBlock(block.id, { content: newContent, formats: newFormats });
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      e.currentTarget.dispatchEvent(inputEvent);
      return;
    }
    
    // Handle HTML paste with formatting - use browser's built-in pasteHTML
    if (pastedHtml && pastedHtml !== pastedText) {
      try {
        // Use browser's built-in pasteHTML which preserves formatting
        range.deleteContents();
        
        // Create a temporary container to sanitize HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pastedHtml;
        
        // Clone and insert the formatted content
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
        
        // Update selection - create new range after pasted content
        const newContent = contentRef.current.textContent || '';
        const newRange = document.createRange();
        newRange.setStartAfter(fragment.lastChild || range.startContainer);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Extract formats from the pasted HTML (with delay to ensure DOM is updated)
        setTimeout(() => {
          if (contentRef.current) {
            const extractedFormats = extractFormatsFromDOM(contentRef.current);
            updateBlock(block.id, { content: newContent, formats: extractedFormats });
          }
        }, 10);
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        e.currentTarget.dispatchEvent(inputEvent);
        return;
      } catch (error) {
        console.error('Error parsing HTML paste:', error);
        // Fall through to plain text paste
      }
    }
    
    // Regular plain text paste
    range.deleteContents();
    const textNode = document.createTextNode(pastedText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger input event to update content
    const inputEvent = new Event('input', { bubbles: true });
    e.currentTarget.dispatchEvent(inputEvent);
  }, [block.id, block.formats, contentRef, updateBlock]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (!range || !contentRef.current) return;

      // Check if cursor is at start or end
      const testRangeStart = range.cloneRange();
      testRangeStart.selectNodeContents(contentRef.current);
      testRangeStart.setEnd(range.startContainer, range.startOffset);
      const isAtStart = testRangeStart.toString().length === 0;

      const testRangeEnd = range.cloneRange();
      testRangeEnd.selectNodeContents(contentRef.current);
      testRangeEnd.setStart(range.startContainer, range.startOffset);
      const isAtEnd = testRangeEnd.toString().length === 0;

      const cursorPos = isAtStart
        ? 0
        : isAtEnd
          ? content.length
          : testRangeStart.toString().length;

      // Handle arrow key navigation
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        let direction: 'up' | 'down' | 'left' | 'right';
        if (e.key === 'ArrowUp') direction = 'up';
        else if (e.key === 'ArrowDown') direction = 'down';
        else if (e.key === 'ArrowLeft') direction = 'left';
        else direction = 'right';

        // Try custom handler first, then fallback to default
        if (onArrowNavigation) {
          const handled = onArrowNavigation(
            block.id,
            direction,
            cursorPos,
            content
          );
          if (handled) {
            e.preventDefault();
            return;
          }
        }

        // Default navigation handler
        const handled = handleArrowNavigation(
          block.id,
          direction,
          cursorPos,
          content
        );
        if (handled) {
          e.preventDefault();
          return;
        }
      }

      // Cmd+Enter inserts page break
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addBlock('pageBreak', block.id);
        return;
      }

      // Enter creates new block
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (onCreateBlockAfter) {
          onCreateBlockAfter();
        } else {
          // Default: create paragraph block after
          const newBlockId = addBlock('paragraph', block.id);
          
          // Focus the new block after a short delay to ensure it's rendered
          setTimeout(() => {
            const newBlockElement = document.querySelector(
              `[data-block-id="${newBlockId}"] .editable-block-content`
            ) as HTMLElement;
            if (newBlockElement) {
              newBlockElement.focus();
              // Set caret at start
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                range.selectNodeContents(newBlockElement);
                range.collapse(true); // Start
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }, 10);
        }
        return;
      }

      // Tab inserts tab character (like Notion)
      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && contentRef.current) {
          const range = selection.getRangeAt(0);
          const tabNode = document.createTextNode('\t');
          range.deleteContents();
          range.insertNode(tabNode);
          range.setStartAfter(tabNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content
          const newContent = contentRef.current.textContent || '';
          setContent(newContent);
          updateBlock(block.id, { content: newContent });
        }
        return;
      }

      // Slash opens menu
      if (e.key === '/') {
        e.preventDefault();
        if (onOpenSlashMenu && contentRef.current) {
          // Simple approach: position relative to the editor blocks container
          const editorContainer = contentRef.current.closest('.editor-view-blocks-container');
          const containerRect = editorContainer?.getBoundingClientRect() || { top: 0, left: 0 };
          
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Collapse range to get caret position
            const caretRange = range.cloneRange();
            caretRange.collapse(true);
            
            // Get caret position using getBoundingClientRect
            const caretRect = caretRange.getBoundingClientRect();
            
            // Calculate position - use getBoundingClientRect directly
            let caretTop: number;
            let caretLeft: number;
            
            // If rect is empty (at line break or empty), insert marker to measure
            if (caretRect.width === 0 && caretRect.height === 0) {
              // Insert temporary marker to get accurate position
              const marker = document.createElement('span');
              marker.style.cssText = 'position: absolute; visibility: hidden; white-space: pre; pointer-events: none; height: 0; width: 0;';
              marker.textContent = '\u200b'; // Zero-width space
              
              try {
                caretRange.insertNode(marker);
                const markerRect = marker.getBoundingClientRect();
                caretTop = markerRect.top;
                caretLeft = markerRect.left;
                marker.remove();
              } catch (error) {
                // Fallback: use content element position
                const contentRect = contentRef.current.getBoundingClientRect();
                caretTop = contentRect.top;
                caretLeft = contentRect.left;
              }
            } else {
              // Normal case - use rect directly
              caretTop = caretRect.top;
              caretLeft = caretRect.left;
            }
            
            // Convert to relative coordinates within the container
            const relativeTop = caretTop - containerRect.top + (editorContainer?.scrollTop || 0);
            const relativeLeft = caretLeft - containerRect.left + (editorContainer?.scrollLeft || 0);
            
            onOpenSlashMenu({
              top: relativeTop + 20, // Offset below caret
              left: relativeLeft,
            });
          } else {
            // Fallback to content element position
            const contentRect = contentRef.current.getBoundingClientRect();
            onOpenSlashMenu({
              top: contentRect.bottom - containerRect.top + (editorContainer?.scrollTop || 0) + 8,
              left: contentRect.left - containerRect.left + (editorContainer?.scrollLeft || 0),
            });
          }
        }
        return;
      }

      // Backspace on empty deletes block
      if (e.key === 'Backspace' && cursorPos === 0 && content === '') {
        e.preventDefault();
        deleteBlock(block.id);
        return;
      }

      // Formatting shortcuts (cmd+b, cmd+i, cmd+u, cmd+e)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (e.key === 'b' || e.key === 'B') {
          // Aggressively prevent default to stop browser bookmark dialog
          e.preventDefault();
          e.stopPropagation();
          // Access native event to stop immediate propagation (prevents browser bookmark dialog)
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation();
          }
          
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && contentRef.current) {
            if (!selection.isCollapsed) {
              // Preserve selection range before focusing
              const range = selection.getRangeAt(0);
              
              // Ensure element is focused
              if (document.activeElement !== contentRef.current) {
                contentRef.current.focus();
              }
              
              // Restore selection after focus
              selection.removeAllRanges();
              selection.addRange(range);
              
              // Apply visual formatting using browser command (handles toggle automatically)
              document.execCommand('bold', false, undefined);
              
              // Extract formats from DOM after browser command
              setTimeout(() => {
                if (contentRef.current) {
                  const extractedFormats = extractFormatsFromDOM(contentRef.current);
                  const newContent = contentRef.current.textContent || '';
                  updateBlock(block.id, { content: newContent, formats: extractedFormats });
                }
              }, 10);
            }
          }
          return;
        }
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          e.stopPropagation();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && contentRef.current) {
            if (!selection.isCollapsed) {
              // Preserve selection range before focusing
              const range = selection.getRangeAt(0);
              
              // Ensure element is focused
              if (document.activeElement !== contentRef.current) {
                contentRef.current.focus();
              }
              
              // Restore selection after focus
              selection.removeAllRanges();
              selection.addRange(range);
              
              // Apply visual formatting using browser command
              document.execCommand('italic', false, undefined);
              
              // Extract formats from DOM after browser command
              setTimeout(() => {
                if (contentRef.current) {
                  const extractedFormats = extractFormatsFromDOM(contentRef.current);
                  const newContent = contentRef.current.textContent || '';
                  updateBlock(block.id, { content: newContent, formats: extractedFormats });
                }
              }, 10);
            }
          }
          return;
        }
        if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          e.stopPropagation();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && contentRef.current) {
            if (!selection.isCollapsed) {
              // Preserve selection range before focusing
              const range = selection.getRangeAt(0);
              
              // Ensure element is focused
              if (document.activeElement !== contentRef.current) {
                contentRef.current.focus();
              }
              
              // Restore selection after focus
              selection.removeAllRanges();
              selection.addRange(range);
              
              // Apply visual formatting using browser command
              document.execCommand('underline', false, undefined);
              
              // Extract formats from DOM after browser command
              setTimeout(() => {
                if (contentRef.current) {
                  const extractedFormats = extractFormatsFromDOM(contentRef.current);
                  const newContent = contentRef.current.textContent || '';
                  updateBlock(block.id, { content: newContent, formats: extractedFormats });
                }
              }, 10);
            }
          }
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          e.stopPropagation();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && contentRef.current) {
            if (!selection.isCollapsed) {
              // Preserve selection range before focusing
              const range = selection.getRangeAt(0);
              
              // Ensure element is focused
              if (document.activeElement !== contentRef.current) {
                contentRef.current.focus();
              }
              
              // Restore selection after focus
              selection.removeAllRanges();
              selection.addRange(range);
              
              // Apply visual formatting - wrap in code element
              try {
                const codeElement = document.createElement('code');
                codeElement.style.background = 'rgba(0, 0, 0, 0.05)';
                codeElement.style.padding = '2px 4px';
                codeElement.style.borderRadius = '3px';
                codeElement.style.fontFamily = 'monospace';
                codeElement.style.fontSize = '0.9em';
                range.surroundContents(codeElement);
              } catch (error) {
                // Fallback - try execCommand
                document.execCommand('formatBlock', false, 'code');
              }
              
              // Extract formats from DOM after browser command
              setTimeout(() => {
                if (contentRef.current) {
                  const extractedFormats = extractFormatsFromDOM(contentRef.current);
                  const newContent = contentRef.current.textContent || '';
                  updateBlock(block.id, { content: newContent, formats: extractedFormats });
                }
              }, 10);
            }
          }
          return;
        }
      }

      // Tab inserts tab character (like Notion)
      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && contentRef.current) {
          const range = selection.getRangeAt(0);
          
          // Insert tab character
          const tabNode = document.createTextNode('\t');
          range.deleteContents();
          range.insertNode(tabNode);
          
          // Move cursor after tab
          range.setStartAfter(tabNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content
          const newContent = contentRef.current.textContent || '';
          setContent(newContent);
          
          // Extract formats to preserve them
          const extractedFormats = extractFormatsFromDOM(contentRef.current);
          updateBlock(block.id, { content: newContent, formats: extractedFormats });
        }
        return;
      }
    },
    [
      block.id,
      content,
      onArrowNavigation,
      onCreateBlockAfter,
      onOpenSlashMenu,
      addBlock,
      deleteBlock,
      handleArrowNavigation,
      updateBlock,
      block.formats,
    ]
  );

  const handleBlockClick = useCallback((e: React.MouseEvent) => {
    if (e.target === contentRef.current) return;

    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range && contentRef.current?.contains(range.startContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      contentRef.current?.focus();
    } else if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      contentRef.current.focus();

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        if (e.clientX < rect.left + rect.width / 2) {
          range.collapse(true);
        } else {
          range.collapse(false);
        }
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  return (
    <div
      className={`editable-block ${isFocused ? 'focused' : ''} ${className}`}
      onClick={handleBlockClick}
      style={{ position: 'relative' }}
    >
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => {
          setIsFocused(true);
          // Ensure selection is set for empty blocks
          if (contentRef.current && (!content || content.trim() === '')) {
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && contentRef.current) {
                const range = document.createRange();
                range.selectNodeContents(contentRef.current);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }, 0);
          }
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        data-placeholder={placeholder}
        data-block-id={block.id}
        className="editable-block-content"
      />
      {isFocused && (
        <CustomCaret containerRef={contentRef} isVisible={isFocused} />
      )}
    </div>
  );
}

