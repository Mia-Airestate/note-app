'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Block } from '@/types/block';
import { useBlockSelection } from '@/contexts/BlockSelectionContext';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { CustomCaret } from '@/components/ui/CustomCaret/CustomCaret';
import './TitleBlock.css';

interface TitleBlockProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onOpenSlashMenu?: (position: { top: number; left: number }) => void;
  onCreateBlockAfter?: () => void;
  onArrowNavigation?: (
    blockId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    cursorPos: number,
    content: string
  ) => boolean;
  onSetRef?: (blockId: string, element: HTMLDivElement | null) => void;
  onBlur?: () => void;
}

export function TitleBlock({
  block,
  onUpdate,
  onDelete,
  onOpenSlashMenu,
  onCreateBlockAfter,
  onArrowNavigation,
  onSetRef,
  onBlur,
}: TitleBlockProps) {
  const [content, setContent] = useState(block.content || '');
  const [isFocused, setIsFocused] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setSelectedBlock } = useBlockSelection();
  const { indentBlock, outdentBlock } = useBlockEditor();

  useEffect(() => {
    if (contentRef.current && onSetRef) {
      onSetRef(block.id, contentRef.current);
    }
    return () => {
      if (onSetRef) {
        onSetRef(block.id, null);
      }
    };
  }, [block.id, onSetRef]);

  // Initialize contentEditable with block content
  useEffect(() => {
    const blockContent = block.content || '';
    if (contentRef.current) {
      contentRef.current.textContent = blockContent;
    }
    setContent(blockContent);
  }, [block.id, block.content]);

  // Sync content from prop when block content changes externally
  useEffect(() => {
    const blockContent = block.content || '';
    if (!isFocused && blockContent !== content) {
      setContent(blockContent);
      if (contentRef.current && contentRef.current.textContent !== blockContent) {
        contentRef.current.textContent = blockContent;
      }
    }
  }, [block.content, isFocused, content]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const value = e.currentTarget.textContent || '';
      setContent(value);
      onUpdate({ content: value });
    },
    [onUpdate]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const text = e.clipboardData.getData('text/plain');
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    const inputEvent = new Event('input', { bubbles: true });
    e.currentTarget.dispatchEvent(inputEvent);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (!range || !contentRef.current) return;

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
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight') &&
        onArrowNavigation
      ) {
        let direction: 'up' | 'down' | 'left' | 'right';
        if (e.key === 'ArrowUp') direction = 'up';
        else if (e.key === 'ArrowDown') direction = 'down';
        else if (e.key === 'ArrowLeft') direction = 'left';
        else direction = 'right';

        const handled = onArrowNavigation(block.id, direction, cursorPos, content);
        if (handled) {
          e.preventDefault();
          return;
        }
      }

      // Enter creates new block
      if (e.key === 'Enter') {
        e.preventDefault();
        // If block is empty and indented (slave), outdent instead
        if (content === '' && block.indent && block.indent > 0) {
          outdentBlock(block.id);
          return;
        }
        if (onCreateBlockAfter) {
          onCreateBlockAfter();
        }
        return;
      }

      // Slash opens menu (only when empty)
      if (e.key === '/' && content === '') {
        e.preventDefault();
        if (onOpenSlashMenu && contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          onOpenSlashMenu({ top: rect.bottom, left: rect.left });
        }
        return;
      }

      // Backspace at start
      if (e.key === 'Backspace' && cursorPos === 0) {
        // If block is indented (slave), outdent it first
        if (block.indent && block.indent > 0) {
          e.preventDefault();
          outdentBlock(block.id);
          return;
        }
        // Otherwise, if empty, delete the block
        if (content === '') {
          e.preventDefault();
          onDelete();
        }
        return;
      }

      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          outdentBlock(block.id);
        } else {
          indentBlock(block.id);
        }
        return;
      }
    },
    [
      block.id,
      block.indent,
      content,
      onArrowNavigation,
      onCreateBlockAfter,
      onOpenSlashMenu,
      onDelete,
      indentBlock,
      outdentBlock,
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
      className={`block title-block ${isFocused ? 'focused' : ''}`}
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
          setSelectedBlock(block.id, 'caret');
        }}
        onBlur={() => {
          setIsFocused(false);
          setSelectedBlock(null, 'caret');
          if (onBlur) {
            onBlur();
          }
        }}
        data-placeholder="Title"
        data-block-id={block.id}
        className="title-content editable-block-content"
      />
      {isFocused && (
        <CustomCaret containerRef={contentRef} isVisible={isFocused} />
      )}
    </div>
  );
}

