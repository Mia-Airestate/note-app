'use client';

import { useState, useEffect, useRef } from 'react';
import './CustomCaret.css';

interface CustomCaretProps {
  containerRef: React.RefObject<HTMLElement>;
  isVisible: boolean;
}

export function CustomCaret({ containerRef, isVisible }: CustomCaretProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    height: number;
  } | null>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !containerRef.current) {
      setPosition(null);
      return;
    }

    const updateCaretPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);

      // Only show caret if selection is collapsed (no text selected)
      if (!range.collapsed) {
        setPosition(null);
        return;
      }

      // Check if the selection is within our container
      if (!containerRef.current?.contains(range.startContainer)) {
        setPosition(null);
        return;
      }

      // Get caret position
      const rect = range.getBoundingClientRect();

      // Find the block container (parent with position: relative)
      let blockContainer = containerRef.current?.parentElement;
      while (
        blockContainer &&
        window.getComputedStyle(blockContainer).position === 'static'
      ) {
        blockContainer = blockContainer.parentElement;
      }

      if (!blockContainer) {
        blockContainer = containerRef.current;
      }

      const containerRect = blockContainer.getBoundingClientRect();

      // Get font metrics for caret height and positioning
      const containerStyle = window.getComputedStyle(containerRef.current);
      const fontSize = parseFloat(containerStyle.fontSize);
      let lineHeight = parseFloat(containerStyle.lineHeight);

      // If line-height is unitless (like 1.6), multiply by font-size
      if (lineHeight < 10) {
        lineHeight = lineHeight * fontSize;
      }

      // Determine caret height - use font-size to match text height
      let caretHeight = fontSize; // Matches text height

      // If we have a valid rect height (text is present), use it
      if (rect.height > 0 && rect.height <= fontSize * 2.5) {
        caretHeight = rect.height;
      }

      // Measure where the first line of text actually starts
      const contentRect = containerRef.current.getBoundingClientRect();
      const contentTop =
        contentRect.top - containerRect.top + (blockContainer.scrollTop || 0);

      // Handle empty blocks: when rect has zero dimensions, use container position
      let top: number;
      let left: number;

      if (rect.width === 0 && rect.height === 0) {
        // Empty block case - center vertically within line-height from container top
        const verticalOffset = (lineHeight - caretHeight) / 2;
        top = contentTop + verticalOffset;
        left =
          contentRect.left -
          containerRect.left +
          (blockContainer.scrollLeft || 0);
      } else {
        // Normal case - align with text but center within line-height
        const rectTop =
          rect.top - containerRect.top + (blockContainer.scrollTop || 0);
        const textTopPadding = (lineHeight - rect.height) / 2;
        top = rectTop - textTopPadding + (lineHeight - caretHeight) / 2;
        left =
          rect.left - containerRect.left + (blockContainer.scrollLeft || 0);
      }

      setPosition({
        top,
        left,
        height: caretHeight,
      });
    };

    // Update position on selection change
    updateCaretPosition();

    // Listen for selection changes
    const handleSelectionChange = () => {
      updateCaretPosition();
    };

    // Listen for scroll events to update position
    const handleScroll = () => {
      updateCaretPosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll);
      // Also listen to parent scroll
      const blockContainer = containerRef.current.parentElement;
      if (blockContainer) {
        blockContainer.addEventListener('scroll', handleScroll);
      }
    }
    window.addEventListener('resize', updateCaretPosition);
    window.addEventListener('scroll', updateCaretPosition, true);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
        const blockContainer = containerRef.current.parentElement;
        if (blockContainer) {
          blockContainer.removeEventListener('scroll', handleScroll);
        }
      }
      window.removeEventListener('resize', updateCaretPosition);
      window.removeEventListener('scroll', updateCaretPosition, true);
    };
  }, [isVisible, containerRef]);

  if (!isVisible || !position) {
    return null;
  }

  return (
    <div
      ref={caretRef}
      className="custom-caret"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        height: `${position.height}px`,
        width: '2px',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}

