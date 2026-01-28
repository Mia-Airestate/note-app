'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiX } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={cn('modal-content', `modal-${size}`)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <GlassButton icon={FiX} onClick={onClose} ariaLabel="Close" />
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

