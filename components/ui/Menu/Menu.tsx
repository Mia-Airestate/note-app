import { cn } from '@/utils/cn';
import './Menu.css';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  className?: string;
}

export function Menu({ items, className }: MenuProps) {
  return (
    <div className={cn('menu', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          className={cn('menu-item', item.disabled && 'menu-item-disabled')}
          onClick={item.onClick}
          disabled={item.disabled}
        >
          {item.icon && <span className="menu-item-icon">{item.icon}</span>}
          <span className="menu-item-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

