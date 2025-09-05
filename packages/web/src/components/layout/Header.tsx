import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../../providers/ThemeProvider';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      student: '학생',
      teacher: '교사',
      admin: '관리자'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <header className="border-b border-border-primary bg-surface-primary/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-text-primary">
            Woodie Campus
          </h1>
        </div>

        {/* 사용자 정보 및 액션 */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-medium">
                      {user.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <div className="text-text-secondary">{getRoleDisplayName(user.role)}</div>
                </div>
              </div>

              {/* 알림 버튼 */}
              <Button variant="ghost" size="sm" className="relative">
                🔔
                {/* 알림 개수 배지 - 추후 구현 */}
                {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span> */}
              </Button>
            </div>
          )}

          {/* 테마 토글 */}
          <ThemeToggle />

          {/* 로그아웃 */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-text-secondary hover:text-text-primary"
            >
              로그아웃
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};