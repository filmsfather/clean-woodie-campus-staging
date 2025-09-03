import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { mainNavigation, canAccessNavItem, type NavSection, type NavItem } from '../../config/navigation';

interface NavSectionProps {
  section: NavSection;
  userRole: string;
}

const NavSectionComponent: React.FC<NavSectionProps> = ({ section, userRole }) => {
  const accessibleItems = section.items.filter(item => 
    canAccessNavItem(item, userRole as any)
  );

  if (accessibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        {section.section}
      </h3>
      <nav className="space-y-1">
        {accessibleItems.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>
    </div>
  );
};

interface NavItemProps {
  item: NavItem;
}

const NavItem: React.FC<NavItemProps> = ({ item }) => {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mx-2 ${
          isActive
            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600 shadow-sm'
            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
        }`
      }
    >
      <span className="mr-3 text-lg flex-shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate">{item.label}</div>
        {item.description && (
          <div className="text-xs text-text-muted truncate mt-0.5">
            {item.description}
          </div>
        )}
      </div>
    </NavLink>
  );
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  const accessibleSections = mainNavigation.filter(section =>
    section.items.some(item => canAccessNavItem(item, user.role as any))
  );

  return (
    <>
      {/* 모바일 오버레이 */}
      {isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* 사이드바 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-surface-secondary border-r border-border-primary
        transform transition-transform duration-300 ease-in-out
        ${isCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* 모바일 헤더 */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">메뉴</h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-surface-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 네비게이션 */}
        <div className="flex-1 overflow-y-auto py-6">
          {accessibleSections.map(section => (
            <NavSectionComponent
              key={section.section}
              section={section}
              userRole={user.role}
            />
          ))}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-border-primary">
          <div className="text-xs text-text-muted text-center">
            Woodie Campus v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

// 모바일 햄버거 메뉴 버튼
export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors"
    >
      <svg
        className="w-6 h-6 text-text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};