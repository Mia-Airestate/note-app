import { ReactNode } from 'react';

/**
 * Highlights matching text in a string with shadow text effect
 * Returns ReactNode with <span> elements around matches
 */
export function highlightText(text: string, query: string): ReactNode {
  if (!query || !text) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: (string | ReactNode)[] = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery, lastIndex);

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Add highlighted match with shadow text
    parts.push(
      <span key={index} className="search-highlight">
        {text.substring(index, index + query.length)}
      </span>
    );

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

