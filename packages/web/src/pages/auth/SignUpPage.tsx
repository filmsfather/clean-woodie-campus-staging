import React from 'react';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { AuthContainer } from '../../containers/auth';

interface SignUpPageProps {
  redirectTo?: string;
}

/**
 * SignUpPage - 회원가입 페이지
 * 
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const SignUpPage: React.FC<SignUpPageProps> = ({ 
  redirectTo = '/dashboard' 
}) => {
  return (
    <FeatureGuard feature="signUp">
      <AuthContainer
        mode="signup"
        redirectTo={redirectTo}
        showToggle={true}
        onAuthSuccess={() => {
          console.log('회원가입 성공');
        }}
      />
    </FeatureGuard>
  );
};