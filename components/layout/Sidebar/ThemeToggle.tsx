'use client';

import { useUIStore } from '@/stores/uiStore';
import { IconButton } from '@/components/ui/IconButton/IconButton';

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <IconButton
      icon={theme === 'light' ? '🌙' : '☀️'}
      label="Toggle theme"
      onClick={toggleTheme}
      size="md"
    />
  );
}

