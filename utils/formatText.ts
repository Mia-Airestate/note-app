import { InlineFormat } from '@/types/block';

export type FormatType = InlineFormat['type'];

/**
 * Apply formatting to selected text in a block
 */
export function applyFormat(
  formats: InlineFormat[] | undefined,
  start: number,
  end: number,
  type: FormatType,
  data?: { url?: string }
): InlineFormat[] {
  if (start === end) return formats || [];

  const newFormats = formats ? [...formats] : [];
  
  // Remove any existing formats that overlap with the selection
  const filtered = newFormats.filter(
    (f) => !(f.start < end && f.end > start)
  );

  // Add new format
  filtered.push({
    type: type as InlineFormat['type'],
    start,
    end,
    data,
  });

  // Sort by start position
  filtered.sort((a, b) => a.start - b.start);

  // Return formats without adjusting positions - applying format doesn't insert text
  return filtered;
}

/**
 * Remove formatting from selected text
 */
export function removeFormat(
  formats: InlineFormat[] | undefined,
  start: number,
  end: number,
  type?: FormatType
): InlineFormat[] {
  if (!formats || formats.length === 0) return [];

  return formats
    .filter((f) => {
      if (type && f.type !== type) return true;
      return !(f.start < end && f.end > start);
    })
    .map((f) => {
      // Adjust positions if format was removed before this one
      if (f.start > end) {
        const length = end - start;
        return { ...f, start: f.start - length, end: f.end - length };
      }
      return f;
    });
}

/**
 * Toggle formatting on selected text
 */
export function toggleFormat(
  formats: InlineFormat[] | undefined,
  start: number,
  end: number,
  type: FormatType,
  data?: { url?: string }
): InlineFormat[] {
  if (start === end) return formats || [];

  // Check if selection already has this format
  const hasFormat = formats?.some(
    (f) => f.type === type && f.start <= start && f.end >= end
  );

  if (hasFormat) {
    return removeFormat(formats, start, end, type);
  } else {
    return applyFormat(formats, start, end, type, data);
  }
}

/**
 * Get formats at a specific position
 */
export function getFormatsAtPosition(
  formats: InlineFormat[] | undefined,
  position: number
): InlineFormat[] {
  if (!formats) return [];
  return formats.filter((f) => f.start <= position && f.end > position);
}

