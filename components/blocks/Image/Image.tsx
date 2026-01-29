'use client';

import { useRef, useState, useCallback } from 'react';
import { BlockComponentProps } from '../registry';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { FiImage, FiUpload, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import './Image.css';

export function ImageBlock({ block }: BlockComponentProps) {
  const { updateBlock } = useBlockEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const src = block.props?.src || '';
  const alt = block.props?.alt || '';
  const caption = block.props?.caption || '';

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateBlock(block.id, {
        props: {
          ...block.props,
          src: dataUrl,
          alt: file.name,
        },
      });
    };
    reader.readAsDataURL(file);
  }, [block.id, block.props, updateBlock]);

  const handleClick = () => {
    if (!src) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    updateBlock(block.id, {
      props: {
        ...block.props,
        src: '',
        alt: '',
      },
    });
  };

  if (!src) {
    return (
      <div
        className={cn(
          'block-image block-image-placeholder',
          isDragging && 'block-image-dragging'
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block-image-input"
        />
        <FiImage size={24} className="block-image-icon" />
        <span className="text-tertiary">
          {isDragging ? 'Drop image here' : 'Click or drag image'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="block-image"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block-image-input"
      />
      <img src={src} alt={alt} />
      {isHovering && (
        <div className="block-image-actions">
          <button
            className="block-image-action"
            onClick={handleReplace}
            title="Replace image"
          >
            <FiRefreshCw size={16} />
          </button>
          <button
            className="block-image-action block-image-action-danger"
            onClick={handleDelete}
            title="Delete image"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )}
      {caption && <div className="block-image-caption">{caption}</div>}
    </div>
  );
}

