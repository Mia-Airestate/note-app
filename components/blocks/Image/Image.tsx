import { BlockComponentProps } from '../registry';
import './Image.css';

export function ImageBlock({ block }: BlockComponentProps) {
  const src = block.props?.src || '';
  const alt = block.props?.alt || '';
  const caption = block.props?.caption || '';

  if (!src) {
    return (
      <div className="block-image block-image-placeholder">
        <span className="text-tertiary">Image block</span>
      </div>
    );
  }

  return (
    <div className="block-image">
      <img src={src} alt={alt} />
      {caption && (
        <div className="block-image-caption">{caption}</div>
      )}
    </div>
  );
}

