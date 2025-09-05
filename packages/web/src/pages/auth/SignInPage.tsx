import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { AuthContainer } from '../../containers/auth';
import { useAuth } from '../../hooks/useAuth';

interface SignInPageProps {
  redirectTo?: string;
}

/**
 * SignInPage - 로그인 페이지
 * 
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const SignInPage: React.FC<SignInPageProps> = ({ 
  redirectTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // 이미 로그인된 사용자는 대시보드로 리디렉션
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우에만 로그인 페이지 표시
  if (isAuthenticated) {
    return null; // 리디렉션 중
  }

  return (
    <FeatureGuard feature="signIn">
      <AuthContainer
        mode="signin"
        redirectTo={redirectTo}
        showToggle={true}
        onAuthSuccess={() => {
          console.log('로그인 성공');
        }}
      />
    </FeatureGuard>
  );
};