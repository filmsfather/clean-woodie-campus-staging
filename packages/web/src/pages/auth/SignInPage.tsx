import React from 'react';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { AuthContainer } from '../../containers/auth';

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