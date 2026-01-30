import { IconType } from 'react-icons';
import { Icon } from '@/components/ui/Icon/Icon';
import { cn } from '@/utils/cn';
import './GlassButton.css';

interface GlassButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconType | string | React.ComponentType<{ size?: number; className?: string }>;
  variant?: 'default' | 'active' | 'primary' | 'danger' | 'yellow' | 'unstyled';
  ariaLabel?: string;
}

export function GlassButton({
  icon,
  variant = 'default',
  className,
  ariaLabel,
  ...props
}: GlassButtonProps) {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <span className="glass-button-icon-text">{icon}</span>;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ size?: number; className?: string }>;
      return <IconComponent size={18} className="glass-button-icon" />;
    }
    return <Icon icon={icon as IconType} size={18} />;
  };

  return (
    <button
      className={cn('glass-button', `glass-button-${variant}`, className)}
      aria-label={ariaLabel}
      {...props}
    >
      {renderIcon()}
    </button>
  );
}

