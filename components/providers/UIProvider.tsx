'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function UIProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
  }, [setTheme]);

  return <>{children}</>;
}

