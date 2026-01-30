# LifeNote - Technical Documentation

A comprehensive technical guide to the note-taking system architecture, block system, interactions, and implementation details.

## Table of Contents

1. [Note System Architecture](#note-system-architecture)
2. [Block System](#block-system)
3. [Slash Menu System](#slash-menu-system)
4. [Keyboard Actions & Shortcuts](#keyboard-actions--shortcuts)
5. [Block Dragging & Moving](#block-dragging--moving)
6. [Image Block Handling](#image-block-handling)
7. [Block Indentation System](#block-indentation-system)
8. [Storage & Serialization](#storage--serialization)

---

## Note System Architecture

### Note Data Structure

A **Note** is the top-level container that holds all blocks and metadata:

```typescript
interface Note {
  id: string;              // Unique identifier (UUID)
  name: string;            // Display name (synced from first title block)
  markdown: string;       // Serialized markdown representation
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

### Note Lifecycle

1. **Creation**: When a new note is created, it starts with an empty markdown string and a default title block
2. **Loading**: Notes are loaded from `localStorage` and parsed from markdown into block structures
3. **Editing**: Blocks are edited in-memory as React state
4. **Serialization**: Changes are debounced (300ms) and serialized to markdown before saving
5. **Persistence**: Serialized markdown is saved to `localStorage` via `saveNotes()`

### Block-to-Markdown Conversion

The system uses a **bidirectional conversion** between blocks and markdown:
- **Parsing**: `parseMarkdown()` converts markdown strings into block structures
- **Serialization**: `serializeToMarkdown()` converts block arrays back to markdown

This ensures compatibility with standard markdown while maintaining rich block-based editing.

---

## Block System

### Block Type Hierarchy

Blocks are organized into a **hierarchical tree structure** with the following types:

#### Text Blocks (ContentEditable)
- `title` - Main document title (synced to note name)
- `title-big` - Large heading
- `title-medium` - Medium heading  
- `title-small` - Small heading
- `body` - Regular text paragraph
- `todo` - Checkbox with text content

#### Non-Text Blocks
- `image` - Image display block with `src` and `alt` properties
- `group-bg` - Vertical container with background color
- `group-tabs` - Tabbed container with multiple tab panels
- `group-horizontal` - Horizontal scrolling container

### Block Data Structure

```typescript
interface BaseBlock {
  id: string;                    // UUID identifier
  type: BlockType;                // Block type enum
  order: number;                  // Display order (auto-calculated)
  children?: string[];            // Child block IDs (for containers)
  parentId?: string;             // Parent block ID (if nested)
  width?: number;                // Width for horizontal group children
  indentLevel?: number;          // 0-3 indent level (master/slave system)
}
```

### Block Rendering Pipeline

1. **BlockRenderer Component**: Routes blocks to specific component based on `type`
2. **Component Selection**: Each block type has a dedicated React component
3. **Props Injection**: Common props (`onUpdate`, `onDelete`, `onDuplicate`) are passed to all blocks
4. **Nested Rendering**: Container blocks recursively render their children via `renderNestedBlocks()`

### Block State Management

Blocks are managed through the `useBlockEditor` hook which provides:
- `blocks` - Array of all blocks in the document
- `addBlock()` - Creates new block and inserts at specified position
- `updateBlock()` - Updates block properties
- `deleteBlock()` - Removes block and handles orphaned children
- `moveBlockById()` - Moves block to new position/parent
- `duplicateBlock()` - Creates copy of block

### Block Selection System

The `BlockSelectionContext` manages two selection modes:

1. **Caret Mode** (`'caret'`): Text cursor is active in a text block
   - Used for text blocks (`body`, `title`, `todo`)
   - Enables text editing and cursor positioning
   - Triggered when clicking/focusing text blocks

2. **Block Mode** (`'block'`): Entire block is selected
   - Used for non-text blocks (`image`, `group-*`)
   - Enables block-level operations (delete, duplicate, move)
   - Triggered when clicking non-text blocks

---

## Slash Menu System

### Triggering the Slash Menu

The slash menu is triggered when the user types `/` in an empty text block:

1. **Detection**: `handleKeyDown` in text block components (`BodyBlock`, `TodoBlock`) listens for `/` key
2. **Condition Check**: Only triggers if block content is empty (`content === ''`)
3. **Position Calculation**: Uses `getBoundingClientRect()` to get cursor position
4. **Menu Display**: Opens `BlockMenu` component at calculated position

### Slash Menu Architecture

The `BlockMenu` component (`src/components/BlockMenu.tsx`) provides:

#### Menu Items
- **Text Blocks**: `title`, `title-big`, `title-medium`, `title-small`, `body`, `todo`
- **Container Blocks**: `group-bg`, `group-tabs`, `group-horizontal`
- **Media Blocks**: `image`

Each item includes:
- `type` - Block type identifier
- `label` - Display name
- `description` - Help text
- `icon` - Visual indicator

#### Menu Interaction Flow

1. **Search Filtering**: Real-time filtering as user types in search input
2. **Keyboard Navigation**: 
   - `ArrowUp`/`ArrowDown` - Navigate items
   - `Enter` - Select highlighted item
   - `Escape` - Close menu
3. **Mouse Interaction**: Click to select, hover to highlight
4. **Selection Handler**: Calls `onSelect(type)` with chosen block type

### Block Creation from Slash Menu

When a block type is selected:

1. **Block Creation**: `addBlock(type)` creates new block with UUID
2. **Insertion Logic**: 
   - If `menuBlockId` exists, inserts after that block
   - If `menuBlockId` is a group, inserts as child of group
   - Otherwise, appends to root level
3. **Focus Management**: Newly created block receives focus via `setNewlyCreatedBlockId()`
4. **Menu Closure**: `closeMenu()` hides the menu

### Context-Aware Filtering

The slash menu can filter items based on context:
- **Empty Line**: Shows all block types
- **Text Context**: Can filter to only text formatting options (if implemented)

---

## Keyboard Actions & Shortcuts

### Text Block Keyboard Handling

Text blocks (`body`, `title`, `todo`) handle keyboard events through `handleKeyDown`:

#### Navigation Keys

**Arrow Keys** (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`):
- **Cursor Position Detection**: Calculates if cursor is at start (`cursorPos === 0`) or end (`cursorPos === content.length`)
- **Block Navigation**: When at boundary, calls `onArrowNavigation()` to move to adjacent block
- **Mode Switching**: 
  - Text blocks → switches to caret mode
  - Non-text blocks → switches to block mode
- **Cursor Positioning**: For text blocks, positions cursor at start/end of target block

#### Content Manipulation

**Enter Key**:
- **Default Behavior**: Creates new block after current block
- **Empty Indented Block**: If block is empty and indented (`indentLevel > 0`), outdents instead
- **Todo Special Case**: Empty todo blocks convert to body blocks

**Backspace Key**:
- **At Start**: If cursor at start (`cursorPos === 0`):
  - If indented → outdents block
  - If empty → deletes block
- **Normal Deletion**: Standard text deletion otherwise

**Tab Key**:
- **Indent**: `Tab` increases indent level (if allowed)
- **Outdent**: `Shift+Tab` decreases indent level
- **Validation**: Only text blocks at root level can be indented (max level 3)

**Slash Key** (`/`):
- **Empty Block**: Opens slash menu at cursor position
- **Position Calculation**: Uses `getBoundingClientRect()` for menu placement

### Non-Text Block Keyboard Handling

Image blocks and other non-text blocks handle:

**Enter Key**: Creates new block after current block
**Backspace/Delete**: Deletes the block
**Arrow Keys**: Navigate to adjacent blocks (via `onArrowNavigation`)

### Global Keyboard Shortcuts

While not fully implemented in NewPage-main, the architecture supports:

**Modifier Combinations**:
- `Cmd/Ctrl + B` - Bold text (in Slate editor)
- `Cmd/Ctrl + I` - Italic text
- `Cmd/Ctrl + \`` - Inline code
- `Cmd/Ctrl + Shift + S` - Strikethrough
- `Cmd/Ctrl + Shift + H` - Highlight

**Markdown Shortcuts**:
- `#` + `Space` - Convert to heading-1
- `##` + `Space` - Convert to heading-2
- `###` + `Space` - Convert to heading-3

### Keyboard Event Flow

1. **Event Capture**: `onKeyDown` handler in block component
2. **Prevention**: `e.preventDefault()` for custom behaviors
3. **State Updates**: Updates block content or triggers block operations
4. **Focus Management**: Maintains focus on appropriate block
5. **Selection Sync**: Updates `BlockSelectionContext` with current selection

---

## Block Dragging & Moving

### Drag System Architecture

The drag system uses **custom pointer event handling** (not HTML5 drag-and-drop API) for precise control:

#### Core Hook: `useBlockDrag`

Located in `src/hooks/useBlockDrag.ts`, provides:

```typescript
interface DragState {
  isDragging: boolean;              // Whether drag is active
  draggedBlockId: string | null;     // ID of block being dragged
  dropTarget: DropTarget | null;     // Calculated drop position
  cursorPosition: { x, y } | null;   // Current cursor coordinates
  clickOffset: { x, y } | null;      // Offset from click to block top-left
}
```

### Drag Initiation

#### Pointer Down Handler

1. **Event Capture**: `handlePointerDown(e, blockId)` captures pointer down
2. **Initial Position**: Stores `{ clientX, clientY }` in `initialPositionRef`
3. **Pending Drag**: Sets `pendingDragBlockIdRef` to block ID
4. **Text Area Detection**: Checks if click was on contentEditable element

#### Drag Delay System

**Text Areas** (contentEditable blocks):
- **Delay Timer**: 800ms delay before drag starts (`DRAG_DELAY_MS`)
- **Movement Cancellation**: If user moves >5px during delay, cancels drag (text selection)
- **Selection Check**: If text is selected, cancels drag

**Non-Text Areas**:
- **Movement Threshold**: Requires >5px movement (`MOVEMENT_THRESHOLD`) before starting drag
- **Immediate Start**: Starts drag once threshold exceeded

### Drag Preview

#### Visual Feedback

1. **Preview Element**: Fixed-position `div` with class `drag-preview` (z-index: 10000)
2. **Content Cloning**: Clones `.block` element from dragged block
3. **Position Tracking**: Updates position based on `cursorPosition - clickOffset`
4. **Size Matching**: Matches width and height of original block

#### Preview Updates

```typescript
useEffect(() => {
  if (dragState.isDragging && dragState.cursorPosition && dragState.clickOffset) {
    preview.style.left = `${cursorPosition.x - clickOffset.x}px`;
    preview.style.top = `${cursorPosition.y - clickOffset.y}px`;
  }
}, [dragState.isDragging, dragState.cursorPosition, dragState.clickOffset]);
```

### Drop Target Calculation

The `findDropTarget(clientX, clientY)` function determines where block will be dropped:

#### Group Drop Detection

1. **Group Element Registration**: Groups register their content areas via `registerGroupElement()`
2. **Content Area Check**: Checks if cursor is inside `.group-content`, `.tabs-content`, or `.horizontal-scroll-container`
3. **Child Position**: Calculates insertion point within group children:
   - **Vertical Groups**: Uses Y position (`clientY > midY`)
   - **Horizontal Groups**: Uses X position (`clientX > midX`)
4. **Tab Groups**: Determines active tab and inserts into that tab's children

#### Root-Level Drop Detection

1. **Block Element Registration**: All blocks register via `registerBlockElement()`
2. **Distance Calculation**: Calculates distance from cursor to each block's midpoint
3. **Closest Block**: Finds block with minimum distance
4. **Insertion Index**: Determines if drop is before or after closest block
5. **Indent Level Inheritance**: Inherits `indentLevel` from block above drop position

### Drop Indicator Rendering

Visual feedback shows where block will be dropped:

```typescript
// Drop indicator appears before/after blocks
{dragState.dropTarget?.afterBlockId === blockId && (
  <div className="drop-indicator" />
)}
```

The indicator is a horizontal line that appears:
- **Before blocks**: When dropping at start of group/root
- **After blocks**: When dropping after a specific block
- **Vertical indicator**: For horizontal groups (vertical line)

### Block Movement Execution

#### Move Handler

When pointer is released (`handlePointerUp`):

1. **Validation**: Checks `dragState.isDragging` and `dragState.dropTarget`
2. **Slave Block Detection**: Identifies "slave" blocks (indented blocks that belong to master)
3. **Master Movement**: Moves master block first
4. **Slave Movement**: Moves all slave blocks after master, preserving hierarchy
5. **Indent Level Updates**: Updates indent levels based on drop target

#### Slave Block System

**Master-Slave Relationship**:
- **Master**: Block with lower indent level
- **Slave**: Block with higher indent level immediately following master
- **Hierarchy**: Slaves inherit indent level from block above them

**Movement Logic**:
```typescript
const slaves = getSlaveBlocks(blockId);
if (slaves.length > 0) {
  // Move master first
  moveBlockById(blockId, dropTarget);
  // Move slaves after, preserving indent relationship
  slaves.forEach((slave, index) => {
    const targetId = index === 0 ? blockId : slaves[index - 1].id;
    moveBlockById(slave.id, { afterBlockId: targetId, indentLevel: newLevel });
  });
}
```

### Block Element Registration

Blocks register their DOM elements for drag detection:

```typescript
const setBlockRef = useCallback((blockId: string, element: HTMLDivElement | null) => {
  if (element) {
    blockElementsRef.current.set(blockId, element);
    registerBlockElement(blockId, element); // Register with drag system
  } else {
    blockElementsRef.current.delete(blockId);
  }
}, [registerBlockElement]);
```

This allows the drag system to:
- Calculate drop positions relative to block bounds
- Clone block content for preview
- Determine which block is under cursor

---

## Image Block Handling

### Image Block Structure

```typescript
interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;        // Data URL or image URL
  alt?: string;       // Alt text for accessibility
}
```

### Image Upload Flow

#### Drag-and-Drop Upload

1. **Event Listeners**: Editor container listens for `drop` and `dragover` events
2. **File Filtering**: Filters dropped files to images (`file.type.startsWith('image/')`)
3. **FileReader API**: Converts file to Data URL:
   ```typescript
   const reader = new FileReader();
   reader.onload = (event) => {
     const src = event.target?.result as string; // Data URL
     const newBlockId = addBlock('image');
     updateBlock(newBlockId, { src, alt: file.name });
   };
   reader.readAsDataURL(file);
   ```
4. **Block Creation**: Creates new image block with Data URL as `src`

### Image Block Rendering

The `ImageBlock` component:

1. **Display**: Shows `<img>` tag if `src` exists, placeholder otherwise
2. **Error Handling**: `onError` handler updates block if image fails to load
3. **Focus Management**: Image block is focusable (`tabIndex={0}`) for keyboard navigation
4. **Selection**: Uses block selection mode (not caret mode)

### Image Block Interactions

**Keyboard**:
- `Enter` - Creates new block after image
- `Backspace`/`Delete` - Deletes image block
- Arrow keys navigate to adjacent blocks

**Mouse**:
- Click selects the image block
- Context menu available for delete/duplicate

---

## Block Indentation System

### Indent Level System

Blocks can have an `indentLevel` from 0-3, creating a **master-slave hierarchy**:

- **Level 0**: Root level (no indent)
- **Level 1-3**: Indented blocks (visual indent + hierarchical relationship)

### Master-Slave Relationship

**Definition**:
- **Master Block**: Block with lower indent level
- **Slave Block**: Block with higher indent level immediately following master
- **Relationship**: Slaves "belong" to their master and move with it

**Example Structure**:
```
Block A (level 0)        ← Master
  Block B (level 1)      ← Slave of A
  Block C (level 1)      ← Slave of A
Block D (level 0)        ← Master
  Block E (level 2)      ← Slave of D (nested under level 1)
```

### Indentation Rules

1. **Only Text Blocks**: Only text block types can be indented:
   - `body`, `title`, `title-big`, `title-medium`, `title-small`, `todo`
2. **Root Level Only**: Blocks inside groups cannot be indented
3. **Maximum Level**: Indent level cannot exceed 3
4. **Inheritance**: New blocks inherit indent level from block above
5. **Constraint**: Block can only indent to be at most 1 level deeper than block above

### Indentation Operations

#### Indent (`Tab` key)

```typescript
const indentBlock = (blockId: string): boolean => {
  // 1. Check if block can be indented
  if (!canIndent(blockId)) return false;
  
  // 2. Get current level
  const currentLevel = block.indentLevel || 0;
  
  // 3. Check constraint: can only indent if level <= block above
  const blockAbove = rootBlocks[blockIndex - 1];
  if (currentLevel > blockAbove.indentLevel) return false;
  
  // 4. Increment indent level
  updateBlock(blockId, { indentLevel: currentLevel + 1 });
};
```

#### Outdent (`Shift+Tab` key)

```typescript
const outdentBlock = (blockId: string): boolean => {
  const currentLevel = block.indentLevel || 0;
  if (currentLevel <= 0) return false;
  
  updateBlock(blockId, { indentLevel: currentLevel - 1 });
};
```

### Slave Block Detection

The `getSlaveBlocks(masterId)` function:

1. **Finds Master**: Locates master block in root blocks array
2. **Iterates Forward**: Checks subsequent blocks
3. **Level Comparison**: Adds blocks with `indentLevel > masterLevel`
4. **Stop Condition**: Stops when finding block with `indentLevel <= masterLevel`

```typescript
const getSlaveBlocks = (masterId: string): Block[] => {
  const master = rootBlocks[masterIndex];
  const masterLevel = master.indentLevel || 0;
  
  const slaves: Block[] = [];
  for (let i = masterIndex + 1; i < rootBlocks.length; i++) {
    const block = rootBlocks[i];
    if (block.indentLevel <= masterLevel) break; // Stop at same/lower level
    slaves.push(block);
  }
  return slaves;
};
```

### Indentation in Drag Operations

When dragging a master block:
1. **Slave Detection**: Identifies all slave blocks
2. **Master Movement**: Moves master to new position
3. **Slave Movement**: Moves slaves after master, preserving indent levels
4. **Level Inheritance**: Each slave inherits level from block above it

---

## Storage & Serialization

### Storage System

#### LocalStorage Backend

Notes are persisted to browser `localStorage`:

```typescript
const STORAGE_KEY = 'block-notes';

// Load all notes
const loadNotes = (): Note[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save all notes
const saveNotes = (notes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};
```

### Markdown Serialization

#### Block-to-Markdown Conversion

The `serializeToMarkdown(blocks)` function converts block array to markdown:

1. **Block Iteration**: Iterates through blocks in order
2. **Type-Specific Serialization**: Each block type has serialization logic:
   - **Text blocks**: Content becomes markdown text
   - **Headings**: Prefixed with `#` based on level
   - **Todos**: `- [ ]` or `- [x]` format
   - **Images**: `![alt](src)` format
   - **Groups**: Nested content with indentation
3. **Order Preservation**: Maintains block order in markdown output

#### Markdown-to-Block Parsing

The `parseMarkdown(markdown)` function converts markdown to blocks:

1. **Markdown Parsing**: Uses markdown parser to create AST
2. **Block Creation**: Creates block objects from AST nodes
3. **Hierarchy Reconstruction**: Rebuilds parent-child relationships
4. **Type Detection**: Maps markdown elements to block types

### Auto-Save System

#### Debounced Serialization

Changes are automatically saved with debouncing:

```typescript
useEffect(() => {
  if (!note) return;
  
  const timeoutId = setTimeout(() => {
    const markdown = serializeToMarkdown(blocks);
    
    // Skip if unchanged
    if (markdown === lastSerializedMarkdownRef.current) return;
    
    // Update note
    lastSerializedMarkdownRef.current = markdown;
    onUpdateNote(note.id, { markdown });
  }, 300); // 300ms debounce
  
  return () => clearTimeout(timeoutId);
}, [blocks, note, onUpdateNote]);
```

#### Change Detection

- **Block Comparison**: Compares serialized markdown to previous version
- **Skip Unchanged**: Avoids unnecessary saves if content unchanged
- **Note ID Tracking**: Only re-parses when note ID changes (not on every markdown change)

---

## Implementation Patterns

### Component Architecture

1. **Container Components**: `NoteEditor` manages block state and orchestration
2. **Presentation Components**: Individual block components handle rendering
3. **Hook-Based Logic**: Business logic extracted to custom hooks (`useBlockEditor`, `useBlockDrag`)
4. **Context for State**: `BlockSelectionContext` provides global selection state

### Event Handling Patterns

1. **Synthetic Events**: React synthetic events for keyboard/mouse
2. **Native Events**: Pointer events for drag operations (better performance)
3. **Event Delegation**: Global listeners for drag tracking
4. **Prevent Default**: Custom behaviors prevent default browser actions

### State Management Patterns

1. **Local State**: Component-level state for UI (focus, menu visibility)
2. **Hook State**: Custom hooks manage block data
3. **Context State**: Global selection state via React Context
4. **Refs for DOM**: `useRef` for DOM element references and timers

### Performance Optimizations

1. **Debounced Saves**: 300ms debounce prevents excessive localStorage writes
2. **Memoization**: `useMemo` and `useCallback` prevent unnecessary re-renders
3. **Conditional Rendering**: Drop indicators only render when dragging
4. **Event Cleanup**: Proper cleanup of event listeners and timers

---

## Technical Stack

- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe development
- **ContentEditable**: Rich text editing for text blocks
- **Slate.js**: Rich text editor framework (in TextRegion component)
- **LocalStorage**: Browser storage API
- **Pointer Events**: Modern drag-and-drop API
- **Markdown**: Serialization format

---

## Key Files Reference

- `src/components/NoteEditor.tsx` - Main editor component
- `src/hooks/useBlockEditor.ts` - Block state management
- `src/hooks/useBlockDrag.ts` - Drag-and-drop logic
- `src/components/BlockRenderer.tsx` - Block routing component
- `src/components/BlockMenu.tsx` - Slash menu component
- `src/types/Block.ts` - Block type definitions
- `src/utils/storage.ts` - Storage utilities
- `src/utils/markdownParser.ts` - Markdown parsing
- `src/utils/markdownSerializer.ts` - Markdown serialization

---

This documentation provides a comprehensive technical overview of the note-taking system. For implementation details, refer to the source code files listed above.
