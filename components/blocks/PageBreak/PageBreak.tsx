'use client';

import { BlockComponentProps } from '../registry';
import './PageBreak.css';

export function PageBreak({ block }: BlockComponentProps) {
  return (
    <div className="block-page-break">
      <div className="block-page-break-line" />
      <span className="block-page-break-label">Page Break</span>
      <div className="block-page-break-line" />
    </div>
  );
}

