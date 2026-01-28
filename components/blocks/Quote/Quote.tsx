import { BlockComponentProps } from '../registry';
import './Quote.css';

export function QuoteBlock({ block }: BlockComponentProps) {
  return (
    <div className="block-quote">
      {block.content || (
        <span className="text-tertiary">Quote block</span>
      )}
    </div>
  );
}

