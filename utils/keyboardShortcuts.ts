import { useEffect, useRef, DependencyList } from 'react';

export interface KeyboardShortcut {
  combo: string;
  handler: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * Check if the user is currently typing in an input field
 */
function isTypingInInput(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  if (!target) return false;

  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = target.isContentEditable;

  // Don't trigger shortcuts when typing in inputs, unless it's Escape
  if (isInput || isContentEditable) {
    return event.key !== 'Escape';
  }

  return false;
}

/**
 * Detect if running on Mac
 */
function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Parse a keyboard combination string into normalized format
 * Examples: "cmd+n" -> { modifiers: ['meta'], key: 'n' }
 *           "ctrl+s" -> { modifiers: ['control'], key: 's' }
 *           "escape" -> { modifiers: [], key: 'escape' }
 */
function parseKeyCombo(combo: string): { modifiers: string[]; key: string } {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim());
  const modifiers: string[] = [];
  let key = '';

  for (const part of parts) {
    if (part === 'cmd' || part === 'meta') {
      modifiers.push('meta');
    } else if (part === 'ctrl' || part === 'control') {
      modifiers.push('control');
    } else if (part === 'alt') {
      modifiers.push('alt');
    } else if (part === 'shift') {
      modifiers.push('shift');
    } else {
      key = part;
    }
  }

  // Normalize key names
  const keyMap: Record<string, string> = {
    esc: 'escape',
    enter: 'enter',
    space: ' ',
    backspace: 'backspace',
    delete: 'delete',
  };

  if (keyMap[key]) {
    key = keyMap[key];
  }

  return { modifiers, key };
}

/**
 * Check if a keyboard event matches a shortcut combination
 */
function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  const { modifiers, key: expectedKey } = parseKeyCombo(combo);

  // Normalize the event key
  let eventKey = event.key.toLowerCase();
  if (eventKey === ' ') {
    eventKey = 'space';
  }

  // Check if the key matches
  if (expectedKey !== eventKey && expectedKey !== event.code.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const hasMeta = event.metaKey;
  const hasCtrl = event.ctrlKey;
  const hasAlt = event.altKey;
  const hasShift = event.shiftKey;

  const wantsMeta = modifiers.includes('meta');
  const wantsCtrl = modifiers.includes('control');
  const wantsAlt = modifiers.includes('alt');
  const wantsShift = modifiers.includes('shift');

  // Handle platform-specific mapping for "cmd"
  // On Mac: cmd uses metaKey
  // On Windows/Linux: when user types "cmd+n", we want it to match ctrlKey
  // This allows "cmd+n" to work on both platforms automatically
  if (wantsMeta) {
    if (isMac()) {
      if (!hasMeta) return false;
    } else {
      // On Windows/Linux, "cmd" should match ctrlKey
      if (!hasCtrl) return false;
    }
  } else {
    // If we don't want meta, ensure metaKey is not pressed (on Mac)
    if (isMac() && hasMeta) return false;
  }

  if (wantsCtrl) {
    if (!hasCtrl) return false;
  } else {
    // If we don't want ctrl, ensure ctrlKey is not pressed
    // But allow it if we wanted meta on Windows/Linux (already handled above)
    if (!wantsMeta || isMac()) {
      if (hasCtrl) return false;
    }
  }

  if (wantsAlt) {
    if (!hasAlt) return false;
  } else {
    if (hasAlt) return false;
  }

  if (wantsShift) {
    if (!hasShift) return false;
  } else {
    if (hasShift) return false;
  }

  return true;
}

/**
 * React hook for registering keyboard shortcuts
 * 
 * @param shortcuts Array of shortcut configurations
 * @param deps Optional dependency array for re-registering shortcuts
 * 
 * @example
 * useKeyboardShortcuts([
 *   {
 *     combo: 'cmd+n',
 *     handler: () => createNewPage(),
 *     enabled: true
 *   },
 *   {
 *     combo: 'escape',
 *     handler: () => goBack(),
 *     enabled: currentView === 'editor'
 *   }
 * ], [currentView]);
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  deps?: DependencyList
) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except Escape)
      if (isTypingInInput(event)) {
        return;
      }

      // Check each registered shortcut
      for (const shortcut of shortcutsRef.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) {
          continue;
        }

        // Check if this shortcut matches
        if (matchesShortcut(event, shortcut.combo)) {
          // Prevent default browser behavior BEFORE calling handler
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          shortcut.handler(event);
          break; // Only trigger one shortcut per keypress
        }
      }
    };

    // Use capture phase to intercept events before browser handles them
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, deps || []);
}

