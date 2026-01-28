import { BlockComponentProps } from '../registry';
import './Divider.css';

export function DividerBlock({ block }: BlockComponentProps) {
  return <hr className="block-divider" />;
}

