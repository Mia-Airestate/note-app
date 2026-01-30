'use client';

import { useEffect, useRef } from 'react';
import './MarkdownCodeView.css';

interface MarkdownCodeViewProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export function MarkdownCodeView({ markdown, onChange }: MarkdownCodeViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Remove auto-resize - let flex handle it

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="markdown-code-view">
      <textarea
        ref={textareaRef}
        className="markdown-code-textarea"
        value={markdown}
        onChange={handleChange}
        spellCheck={false}
      />
    </div>
  );
}

