import { Page } from '@/types/page';
import { Block, FlowBlock, FloatingObject } from '@/types/block';

/**
 * Migrate old Page structure (blocks array) to new structure (flowBlocks + floatingObjects)
 * This ensures backward compatibility with existing data
 */
export function migratePage(page: Page): Page {
  // If already migrated, return as-is
  if (page.flowBlocks !== undefined && page.floatingObjects !== undefined) {
    return page;
  }

  // Migrate from old blocks array
  if (page.blocks && page.blocks.length > 0) {
    const flowBlocks: FlowBlock[] = [];
    const floatingObjects: FloatingObject[] = [];

    for (const block of page.blocks) {
      // Images are always floating objects
      if (block.type === 'image') {
        floatingObjects.push({
          id: block.id,
          type: 'image',
          position: block.position || { x: 0, y: 0, z: 0 },
          size: block.size || { width: 300, height: 200 },
          content: {
            src: block.props?.src || '',
            alt: block.props?.alt || '',
            caption: block.props?.caption || '',
          },
          wrapMode: 'around',
          zIndex: block.position?.z || 0,
        });
      } else {
        // All other blocks are flow blocks
        flowBlocks.push({
          id: block.id,
          type: block.type as FlowBlock['type'],
          content: block.content,
          formats: block.formats,
          props: {
            level: block.props?.level,
            listType: block.props?.listType,
            language: block.props?.language,
            columns: block.props?.columns,
            rows: block.props?.rows,
            headers: block.props?.headers,
          },
          children: block.children as FlowBlock[] | undefined,
          indent: block.indent,
          pageBreak: block.type === 'pageBreak',
        });
      }
    }

    return {
      ...page,
      flowBlocks,
      floatingObjects,
      // Keep blocks for backward compatibility during transition
      blocks: page.blocks,
    };
  }

  // Empty page - initialize with empty arrays
  return {
    ...page,
    flowBlocks: [],
    floatingObjects: [],
  };
}

/**
 * Convert new Page structure back to legacy blocks array (for export/migration)
 */
export function pageToLegacyBlocks(page: Page): Block[] {
  const blocks: Block[] = [];

  // Add flow blocks
  for (const flowBlock of page.flowBlocks) {
    blocks.push({
      id: flowBlock.id,
      type: flowBlock.type as Block['type'],
      content: flowBlock.content,
      formats: flowBlock.formats,
      props: flowBlock.props as Block['props'],
      children: flowBlock.children as Block[] | undefined,
      indent: flowBlock.indent,
      layoutMode: 'flow',
    });
  }

  // Add floating objects as blocks with absolute positioning
  for (const floating of page.floatingObjects) {
    if (floating.type === 'image') {
      blocks.push({
        id: floating.id,
        type: 'image',
        content: '',
        props: {
          src: floating.content.src,
          alt: floating.content.alt,
          caption: floating.content.caption,
        },
        layoutMode: 'absolute',
        position: floating.position,
        size: floating.size,
      });
    }
  }

  return blocks;
}

