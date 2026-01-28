'use client';

import { ReactNode } from 'react';
import { CollapsibleSidebar } from '@/components/layout/Sidebar/CollapsibleSidebar';
import { Icon } from '@/components/ui/Icon/Icon';
import { GlassButton } from '@/components/ui/GlassButton/GlassButton';
import { FiFileText, FiSettings, FiShare2 } from 'react-icons/fi';
import './AppWindow.css';

interface AppWindowProps {
  children: ReactNode;
  title?: string;
}

export function AppWindow({ children, title = 'Life note' }: AppWindowProps) {
  return (
    <div className="app-window">
      <div className="app-window-header">
        <div className="app-window-controls">
          <button className="window-control window-control-close" />
          <button className="window-control window-control-minimize" />
          <button className="window-control window-control-maximize" />
        </div>
        <div className="app-window-title">
          <Icon icon={FiFileText} size={14} className="app-window-icon" />
          <span>{title}</span>
        </div>
        <div className="app-window-actions">
          <GlassButton icon={FiSettings} iconSize={16} ariaLabel="Settings" />
          <GlassButton icon={FiShare2} iconSize={16} ariaLabel="Share" />
        </div>
      </div>
      <div className="app-window-content">
        <CollapsibleSidebar />
        <div className="app-window-main">{children}</div>
      </div>
    </div>
  );
}

