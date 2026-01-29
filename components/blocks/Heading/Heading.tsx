'use client';

import { BlockComponentProps } from '../registry';
import { cn } from '@/utils/cn';
import { EditableBlock } from '../EditableBlock';
import './Heading.css';

export function Heading({ block, ...props }: BlockComponentProps & { onOpenSlashMenu?: (position: { top: number; left: number }) => void }) {
  const level = block.props?.level || 1;
  const className = `block-heading-${level}`;

  return (
    <EditableBlock
      block={block}
      className={cn('block-heading', className)}
      placeholder={`Heading ${level}`}
      {...props}
    />
  );
}

