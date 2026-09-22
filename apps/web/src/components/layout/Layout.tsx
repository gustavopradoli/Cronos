import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

export default function Layout({ children, activeItem, onNavigate }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout${collapsed ? ' layout--collapsed' : ''}`}>
      <Sidebar
        activeItem={activeItem}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
