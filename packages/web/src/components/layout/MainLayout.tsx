import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { MobileMenuButton } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

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