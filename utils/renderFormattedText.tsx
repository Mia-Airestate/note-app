import React from 'react';
import { InlineFormat } from '@/types/block';

/**
 * Render text with inline formatting applied
 */
export function renderFormattedText(
  content: string,
  formats: InlineFormat[] | undefined
): React.ReactNode {
  if (!formats || formats.length === 0) {
    return content;
  }

  // Sort formats by start position
  const sortedFormats = [...formats].sort((a, b) => a.start - b.start);

  // Build array of text segments with formatting
  const segments: Array<{
    text: string;
    formats: InlineFormat[];
  }> = [];

  let currentPos = 0;

  for (const format of sortedFormats) {
    // Add text before this format
    if (format.start > currentPos) {
      segments.push({
        text: content.substring(currentPos, format.start),
        formats: [],
      });
    }

    // Add formatted text
    const formatEnd = Math.min(format.end, content.length);
    segments.push({
      text: content.substring(format.start, formatEnd),
      formats: [format],
    });

    currentPos = formatEnd;
  }

  // Add remaining text
  if (currentPos < content.length) {
    segments.push({
      text: content.substring(currentPos),
      formats: [],
    });
  }

  // Render segments with formatting
  return segments.map((segment, index) => {
    let element: React.ReactNode = segment.text;

    // Apply formats in order
    for (const format of segment.formats) {
      switch (format.type) {
        case 'bold':
          element = <strong key={`${index}-bold`}>{element}</strong>;
          break;
        case 'italic':
          element = <em key={`${index}-italic`}>{element}</em>;
          break;
        case 'underline':
          element = (
            <u key={`${index}-underline`} style={{ textDecoration: 'underline' }}>
              {element}
            </u>
          );
          break;
        case 'strikethrough':
          element = (
            <s key={`${index}-strikethrough`} style={{ textDecoration: 'line-through' }}>
              {element}
            </s>
          );
          break;
        case 'code':
          element = (
            <code
              key={`${index}-code`}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                padding: '2px 4px',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
              }}
            >
              {element}
            </code>
          );
          break;
        case 'link':
          element = (
            <a
              key={`${index}-link`}
              href={format.data?.url || '#'}
              style={{ color: '#007AFF', textDecoration: 'underline' }}
            >
              {element}
            </a>
          );
          break;
        case 'highlight':
          element = (
            <mark
              key={`${index}-highlight`}
              style={{ background: 'rgba(255, 235, 59, 0.3)' }}
            >
              {element}
            </mark>
          );
          break;
      }
    }

    return <React.Fragment key={index}>{element}</React.Fragment>;
  });
}

