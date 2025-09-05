import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tokenStorage } from '../../utils/auth';
import type { UserRole } from '@woodie/domain';

interface MockLoginButtonsProps {
  className?: string;
}

/**
 * 개발용 Mock 로그인 버튼들
 * 
 * NODE_ENV가 development일 때만 표시되며,
 * 각 역할별로 빠르게 로그인할 수 있습니다.
 */
export const MockLoginButtons: React.FC<MockLoginButtonsProps> = ({ 
  className = '' 
}) => {
  const { login, logout, user } = useAuth();

  // production 환경에서는 렌더링하지 않음
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleMockLogin = (role: UserRole) => {
    const mockUsers = {
      student: {
        id: 'mock-student-1',
        email: 'student@woodie.com',
        name: '김학생',
        displayName: '김학생',
        role: 'student' as UserRole,
        organizationId: 'mock-org-1',
        gradeLevel: 10,
        isActive: true
      },
      teacher: {
        id: 'mock-teacher-1', 
        email: 'teacher@woodie.com',
        name: '김교사',
        displayName: '김교사',
        role: 'teacher' as UserRole,
        organizationId: 'mock-org-1',
        isActive: true
      },
      admin: {
        id: 'mock-admin-1',
        email: 'admin@woodie.com', 
        name: '관리자',
        displayName: '관리자',
        role: 'admin' as UserRole,
        organizationId: 'mock-org-1',
        isActive: true
      }
    };

    const mockUser = mockUsers[role];
    const mockAccessToken = `mock-${role}-token-${Date.now()}`;
    const mockRefreshToken = `mock-${role}-refresh-${Date.now()}`;

    login(mockUser, mockAccessToken, mockRefreshToken);
  };

  return (
    <div className={`dev-mock-login ${className}`}>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>개발 모드:</strong> Mock 로그인 버튼들입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">빠른 로그인:</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMockLogin('student')}
            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            disabled={user?.role === 'student'}
          >
            👨‍🎓 학생으로 로그인
          </button>
          
          <button
            onClick={() => handleMockLogin('teacher')}
            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            disabled={user?.role === 'teacher'}
          >
            👨‍🏫 교사로 로그인
          </button>
          
          <button
            onClick={() => handleMockLogin('admin')}
            className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            disabled={user?.role === 'admin'}
          >
            👨‍💼 관리자로 로그인
          </button>
        </div>

        {user && (
          <div className="mt-3 p-2 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-600">
              현재 로그인: <strong>{user.name}</strong> ({user.role})
            </p>
            <button
              onClick={logout}
              className="mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
};