import React, { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '@woodie/domain';

interface RoleGuardProps {
  /**
   * 허용된 역할들
   */
  allowedRoles: UserRole[];
  
  /**
   * 컴포넌트를 children으로 받을지, Outlet을 사용할지 결정
   */
  children?: ReactNode;
  
  /**
   * 권한이 없을 때 리다이렉트할 경로 (기본: '/unauthorized')
   */
  redirectTo?: string;
  
  /**
   * 권한이 없을 때 보여줄 대체 컴포넌트
   * redirectTo가 설정되어 있으면 무시됨
   */
  fallback?: ReactNode;
  
  /**
   * 로딩 중일 때 보여줄 컴포넌트
   */
  loading?: ReactNode;
}

/**
 * 역할 기반 접근 제어 컴포넌트
 * 
 * 사용자의 역할에 따라 컴포넌트 렌더링을 제어합니다.
 * 권한이 없는 경우 리다이렉트하거나 fallback 컴포넌트를 보여줍니다.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  redirectTo = '/unauthorized',
  fallback,
  loading = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 로딩 중이면 로딩 컴포넌트 표시
  if (isLoading) {
    return <>{loading}</>;
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/auth/signin" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 역할 권한 체크
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    // 리다이렉트가 설정되어 있으면 리다이렉트
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    // 아니면 fallback 컴포넌트 표시
    return (
      <>
        {fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              접근 권한이 없습니다
            </h1>
            <p className="text-gray-600 text-center mb-6">
              이 페이지에 접근하려면 {allowedRoles.map(role => {
                switch (role) {
                  case 'admin': return '관리자';
                  case 'teacher': return '교사';
                  case 'student': return '학생';
                  default: return role;
                }
              }).join(' 또는 ')} 권한이 필요합니다.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        )}
      </>
    );
  }

  // 권한이 있으면 children 또는 Outlet 렌더링
  return children ? <>{children}</> : <Outlet />;
};

/**
 * 관리자 전용 가드 컴포넌트
 */
export const AdminGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard allowedRoles={['admin']} {...props} />
);

/**
 * 교사 이상 권한 가드 컴포넌트 (교사 + 관리자)
 */
export const TeacherGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard allowedRoles={['teacher', 'admin']} {...props} />
);

/**
 * 학생 전용 가드 컴포넌트
 */
export const StudentGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard allowedRoles={['student']} {...props} />
);

/**
 * 인증된 사용자 전용 가드 컴포넌트 (모든 역할 허용)
 */
export const AuthGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard allowedRoles={['student', 'teacher', 'admin']} {...props} />
);