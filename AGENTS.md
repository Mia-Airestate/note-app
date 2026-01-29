# Agent Instructions

## Project Overview
LifeNote is an Apple-inspired note-taking app with glass morphism design, built with Next.js 14, React, TypeScript, and Zustand.

## Quick Start
```bash
npm install
npm run dev
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js app router, main page |
| `components/` | React components (layout/, ui/, views/, blocks/) |
| `hooks/` | Custom React hooks |
| `stores/` | Zustand state stores |
| `utils/` | Pure utility functions |
| `styles/` | Global CSS and variables |
| `types/` | TypeScript type definitions |

## Code Style Rules

### DRY Principle
- Extract reusable logic to `utils/` as pure functions
- Extract reusable hooks to `hooks/`
- Don't duplicate code across components

### Single Responsibility
- Each file serves ONE purpose
- utils/ = pure functions (no React hooks)
- hooks/ = React hooks only
- stores/ = Zustand state management

### Naming Conventions
- Components: PascalCase (`GlassButton.tsx`)
- Functions: camelCase (`saveCurrentNote`)
- CSS classes: kebab-case (`glass-button-danger`)
- Types: PascalCase (`interface PageState`)

## Important Patterns

### Glass Morphism Styling
Always use CSS variables from `styles/variables.css`:
```css
background: var(--glass-bg-light);
backdrop-filter: var(--glass-backdrop-filter);
box-shadow: var(--shadow-medium);
border: 1px solid var(--glass-border-light);
```

### GlassButton Usage
```tsx
// For primary actions (blue)
<GlassButton icon={FiPlus} variant="primary" />

// For delete actions (red)
<GlassButton icon={FiTrash2} variant="danger" />

// For header buttons (no background)
<GlassButton icon={FiSettings} variant="unstyled" />
```

### Keyboard Shortcuts
Use the hook system, never add raw event listeners:
```tsx
import { useKeyboardShortcuts } from '@/utils/keyboardShortcuts';

useKeyboardShortcuts([
  { combo: 'cmd+n', handler: () => createPage() },
  { combo: 'escape', handler: () => goBack(), enabled: isEditing }
], [dependencies]);
```

### State Management
Access Zustand stores with selectors:
```tsx
const pages = usePageStore((state) => state.pages);
const createPage = usePageStore((state) => state.createPage);
```

### Navigation
```tsx
const setView = useNavigationStore((state) => state.setView);
const goBack = useNavigationStore((state) => state.goBack);

// Navigate to editor
setView('editor', noteId);

// Go back to list (always save first)
saveCurrentNote();
goBack();
```

### Storage Operations
All storage is in IndexedDB via `utils/storage.ts`:
```tsx
import { savePage, getAllPages, deletePage } from '@/utils/storage';
```

## Common Gotchas

1. **Maximum update depth exceeded**: Check useEffect dependencies, avoid calling setState in useEffect that triggers re-render
2. **Stale closure in event handlers**: Use useRef to track current values
3. **Browser shortcuts conflict**: Use `{ capture: true }` in event listeners
4. **Mobile sidebar**: Hide completely on mobile, don't just collapse
5. **Group titles**: Never use `.toUpperCase()` (user preference)
6. **Hover on colored buttons**: Only change opacity, not background

## Testing Checklist

Before committing any UI changes:
- [ ] Typecheck passes (`npm run build`)
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Works on desktop (≥768px)
- [ ] Works on mobile (<768px)
- [ ] Keyboard shortcuts work
- [ ] No console errors

## Files to Update Together

When modifying these, update related files:

| Change | Also Update |
|--------|-------------|
| Add new store action | Export type if used by components |
| Add CSS variable | Update both light and dark theme |
| Add keyboard shortcut | Add to hooks/useGlobalShortcuts.ts or useEditorShortcuts.ts |
| Add GlassButton variant | Update GlassButton.css hover states |
| Change Page type | Update storage.ts and pageStore.ts |

## User Preferences (from conversation history)

- Apple-inspired glass morphism design
- No uppercase text in group titles
- Yellow shadow (not block) for search highlighting
- Swipe delete threshold: 50% of item width
- Delete button: Fixed position, doesn't slide
- Colored button hover: Only opacity changes
- Sidebar toggle: Next to window controls
- Mobile: Full-screen views, hidden sidebar

