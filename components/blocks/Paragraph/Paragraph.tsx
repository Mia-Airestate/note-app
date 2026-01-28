import { BlockComponentProps } from '../registry';
import './Paragraph.css';

export function Paragraph({ block }: BlockComponentProps) {
  return (
    <div className="block-paragraph">
      {block.content || <span className="text-tertiary">Paragraph</span>}
    </div>
  );
}

