'use client';

import { BlockComponentProps } from '../registry';
import { EditableBlock } from '../EditableBlock';
import './Paragraph.css';

export function Paragraph({ block, ...props }: BlockComponentProps & { onOpenSlashMenu?: (position: { top: number; left: number }) => void }) {
  return (
    <EditableBlock
      block={block}
      className="block-paragraph"
      placeholder="Paragraph"
      {...props}
    />
  );
}

