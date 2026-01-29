'use client';

import { ReactNode } from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="page-container">
      {children}
    </div>
  );
}

