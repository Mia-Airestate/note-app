import { BlockComponentProps } from '../registry';
import { cn } from '@/utils/cn';
import './List.css';

export function ListBlock({ block }: BlockComponentProps) {
  const listType = block.props?.listType || 'unordered';
  const items = block.content.split('\n').filter(Boolean);

  if (listType === 'checklist') {
    return (
      <div className="block-list-checklist">
        {items.map((item, index) => (
          <div key={index} className="block-list-checklist-item">
            <input type="checkbox" />
            <span>{item || 'List item'}</span>
          </div>
        ))}
      </div>
    );
  }

  const Tag = listType === 'ordered' ? 'ol' : 'ul';
  const className = cn(
    'block-list',
    listType === 'ordered' && 'block-list-ordered'
  );

  return (
    <Tag className={className}>
      {items.map((item, index) => (
        <li key={index} className="block-list-item">
          {item || 'List item'}
        </li>
      ))}
    </Tag>
  );
}

