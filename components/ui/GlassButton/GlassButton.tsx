import { IconType } from 'react-icons';
import { Icon } from '@/components/ui/Icon/Icon';
import { cn } from '@/utils/cn';
import './GlassButton.css';

interface GlassButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconType;
  variant?: 'default' | 'active' | 'primary';
  ariaLabel?: string;
}

export function GlassButton({
  icon,
  variant = 'default',
  className,
  ariaLabel,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn('glass-button', `glass-button-${variant}`, className)}
      aria-label={ariaLabel}
      {...props}
    >
      <Icon icon={icon} size={16} />
    </button>
  );
}

