import { BlockComponentProps } from '../registry';
import { cn } from '@/utils/cn';
import './Heading.css';

export function Heading({ block }: BlockComponentProps) {
  const level = block.props?.level || 1;
  const className = `block-heading-${level}`;

  return (
    <div className={cn('block-heading', className)}>
      {block.content || <span className="text-tertiary">Heading {level}</span>}
    </div>
  );
}

