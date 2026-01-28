import { IconType } from 'react-icons';
import { cn } from '@/utils/cn';
import './Icon.css';

interface IconProps {
  icon: IconType;
  size?: number | string;
  className?: string;
}

export function Icon({ icon: IconComponent, size = 20, className }: IconProps) {
  return (
    <IconComponent
      className={cn('icon', className)}
      size={size}
    />
  );
}

