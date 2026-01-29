import { FlowBlock, FloatingObject, Block } from '@/types/block';

/**
 * Convert FlowBlock to Block for rendering compatibility
 */
export function flowBlockToBlock(flowBlock: FlowBlock): Block {
  return {
    id: flowBlock.id,
    type: flowBlock.type as Block['type'],
    content: flowBlock.content,
    formats: flowBlock.formats,
    props: flowBlock.props as Block['props'],
    children: flowBlock.children as Block[] | undefined,
    indent: flowBlock.indent,
    layoutMode: 'flow',
  };
}

/**
 * Convert FloatingObject to Block for rendering compatibility
 */
export function floatingObjectToBlock(floating: FloatingObject): Block {
  if (floating.type === 'image') {
    return {
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
    };
  }
  
  // For other floating object types, create a placeholder block
  return {
    id: floating.id,
    type: 'paragraph',
    content: floating.content.text || '',
    layoutMode: 'absolute',
    position: floating.position,
    size: floating.size,
  };
}

/**
 * Convert Block back to FlowBlock (for saving)
 */
export function blockToFlowBlock(block: Block): FlowBlock {
  return {
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
  };
}

/**
 * Convert Block back to FloatingObject (for saving)
 */
export function blockToFloatingObject(block: Block): FloatingObject | null {
  if (block.type === 'image' && block.layoutMode === 'absolute' && block.position && block.size) {
    return {
      id: block.id,
      type: 'image',
      position: block.position,
      size: block.size,
      content: {
        src: block.props?.src || '',
        alt: block.props?.alt || '',
        caption: block.props?.caption || '',
      },
      wrapMode: 'around',
      zIndex: block.position.z,
    };
  }
  return null;
}

