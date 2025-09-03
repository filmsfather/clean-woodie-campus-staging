import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { MobileMenuButton } from './Sidebar';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* 헤더 */}
      <Header />
      
      <div className="flex">
        {/* 사이드바 */}
        <Sidebar 
          isCollapsed={isSidebarOpen}
          onToggle={toggleSidebar}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
            {/* 모바일 메뉴 버튼 + 브레드크럼 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <MobileMenuButton onClick={toggleSidebar} />
                <Breadcrumb />
              </div>
            </div>
            
            {/* 페이지 콘텐츠 */}
            <div className="max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};