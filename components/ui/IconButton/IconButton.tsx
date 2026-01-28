import { cn } from '@/utils/cn';
import './IconButton.css';

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon,
  label,
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn('icon-btn', `icon-btn-${size}`, className)}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}

