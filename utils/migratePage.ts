import { Page } from '@/types/page';
import { Block, FlowBlock } from '@/types/block';
import { serializeBlocksToMarkdown } from '@/utils/markdownSerializer';

/**
 * Migrate old Page structure (flowBlocks/blocks) to new markdown-based structure
 * This ensures backward compatibility with existing data
 */
export function migratePage(page: any): Page {
  // If already migrated to markdown, return as-is
  if (page.markdown !== undefined) {
    return page as Page;
  }

  // Convert flowBlocks to blocks, then to markdown
  if (page.flowBlocks && page.flowBlocks.length > 0) {
    const blocks: Block[] = page.flowBlocks.map((flowBlock: FlowBlock) => ({
      id: flowBlock.id,
      type: flowBlock.type as Block['type'],
      content: flowBlock.content,
      formats: flowBlock.formats,
      props: flowBlock.props as Block['props'],
      children: flowBlock.children as Block[] | undefined,
      indent: flowBlock.indent,
      layoutMode: 'flow',
    }));

    const markdown = serializeBlocksToMarkdown(blocks);

    return {
      id: page.id,
      title: page.title || 'Untitled',
      markdown,
      createdAt: page.createdAt || Date.now(),
      updatedAt: page.updatedAt || Date.now(),
    };
  }

  // Convert legacy blocks array to markdown
  if (page.blocks && page.blocks.length > 0) {
    const markdown = serializeBlocksToMarkdown(page.blocks as Block[]);

    return {
      id: page.id,
      title: page.title || 'Untitled',
      markdown,
      createdAt: page.createdAt || Date.now(),
      updatedAt: page.updatedAt || Date.now(),
    };
  }

  // Empty page - initialize with empty markdown
  return {
    id: page.id || '',
    title: page.title || 'Untitled',
    markdown: '',
    createdAt: page.createdAt || Date.now(),
    updatedAt: page.updatedAt || Date.now(),
  };
}

