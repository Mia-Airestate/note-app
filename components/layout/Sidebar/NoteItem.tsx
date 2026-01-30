'use client';

import { useState, useRef, useEffect } from 'react';
import { Page } from '@/types/page';
import { cn } from '@/utils/cn';
import { formatNoteDate, getNotePreview } from '@/utils/dateGrouping';
import { highlightText } from '@/utils/highlightText';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiTrash2 } from 'react-icons/fi';
import './NoteItem.css';

interface NoteItemProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  searchQuery?: string;
}

export function NoteItem({ page, isActive, onClick, onDelete, searchQuery }: NoteItemProps) {
  const preview = getNotePreview(page.markdown || '');
  const dateStr = formatNoteDate(page.updatedAt);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const mouseStartX = useRef<number>(0);
  const mouseStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const swipeOffsetRef = useRef<number>(0); // Track current swipeOffset to avoid closure issues

  const SWIPE_THRESHOLD = 10; // minimum pixels to start swipe

  // Get delete threshold as 50% of item width
  const getDeleteThreshold = () => {
    if (buttonRef.current) {
      return buttonRef.current.offsetWidth * 0.5;
    }
    return 80; // fallback
  };

  const handleStart = (clientX: number, clientY: number) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    mouseStartX.current = clientX;
    mouseStartY.current = clientY;
    isSwiping.current = false;
    isDragging.current = false;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isSwiping.current && !isDragging.current) {
      const deltaX = Math.abs(clientX - touchStartX.current);
      const deltaY = Math.abs(clientY - touchStartY.current);
      // Only start swiping if horizontal movement is greater than vertical
      if (deltaX > SWIPE_THRESHOLD && deltaX > deltaY) {
        isSwiping.current = true;
        isDragging.current = true;
      } else if (deltaY > SWIPE_THRESHOLD) {
        return; // Vertical scroll, don't interfere
      }
    }

    if (isSwiping.current || isDragging.current) {
      const deltaX = touchStartX.current - clientX;
      // Only allow swiping left (positive deltaX)
      if (deltaX > 0) {
        const maxSwipe = buttonRef.current?.offsetWidth || 300;
        const newOffset = Math.min(deltaX, maxSwipe);
        swipeOffsetRef.current = newOffset; // Update ref immediately
        setSwipeOffset(newOffset);
      }
    }
  };

  const handleEnd = () => {
    const currentOffset = swipeOffsetRef.current; // Use ref to get current value
    const deleteThreshold = getDeleteThreshold();
    if (currentOffset >= deleteThreshold && onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(page.id);
      }, 200);
    } else {
      // Snap back
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
    }
    isSwiping.current = false;
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Reset swipe when clicking
  const handleClick = () => {
    if (swipeOffset === 0) {
      onClick();
    } else {
      setSwipeOffset(0);
    }
  };

  // Reset swipe when note becomes inactive
  useEffect(() => {
    if (!isActive) {
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
    }
  }, [isActive]);

  // Keep ref in sync with state
  useEffect(() => {
    swipeOffsetRef.current = swipeOffset;
  }, [swipeOffset]);

  return (
    <div 
      className="note-item-wrapper" 
      ref={wrapperRef}
      data-swiping={swipeOffset > 0 ? '' : undefined}
    >
      <div className="note-item-delete-action">
        <GlassButton
          icon={FiTrash2}
          variant="danger"
          ariaLabel="Delete note"
          onClick={() => onDelete?.(page.id)}
        />
      </div>
      <button
        ref={buttonRef}
        className={cn('note-item', isActive && 'note-item-active', isDeleting && 'note-item-deleting')}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <div className="note-item-content">
          <div>
            {searchQuery ? highlightText(page.title, searchQuery) : page.title}
          </div>
        </div>
      </button>
    </div>
  );
}
