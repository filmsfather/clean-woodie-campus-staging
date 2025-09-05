import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthForms } from '../../hooks';
import { SignInForm } from '../../components/auth/SignInForm';
import { SignUpForm } from '../../components/auth/SignUpForm';
import { useAuth } from '../../contexts/AuthContext';
import { MockLoginButtons } from '../../components/dev/MockLoginButtons';
import type { SignInFormState, SignUpFormState } from '../../types/auth';

/**
 * AuthContainer - 인증 통합 컨테이너
 * 
 * Clean Architecture:
 * - Presentation Layer: UI Components (SignInForm, SignUpForm)
 * - Application Layer: Custom Hook (useAuthForms)
 * - Domain/Infrastructure: API Services → UseCases
 * 
 * 역할:
 * - 로그인/회원가입 폼 관리
 * - 인증 상태 기반 라우팅
 * - 초대 토큰 처리
 * - 에러 및 성공 상태 관리
 */

interface AuthContainerProps {
  mode?: 'signin' | 'signup';
  redirectTo?: string;
  className?: string;
  showToggle?: boolean;
  onAuthSuccess?: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  mode: initialMode = 'signin',
  redirectTo = '/dashboard',
  className = '',
  showToggle = true,
  onAuthSuccess
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(initialMode);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // URL에서 초대 토큰 확인
  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      setInviteToken(token);
      setCurrentMode('signup'); // 초대 토큰이 있으면 회원가입 모드로
    }
  }, [searchParams]);

  // 이미 인증된 사용자는 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // useAuthForms 훅 사용
  const {
    signInState,
    signInForm,
    setSignInForm,
    handleSignIn,
    resetSignInForm,
    signUpState,
    signUpForm,
    setSignUpForm,
    handleSignUp,
    resetSignUpForm,
    resetPasswordState,
    handlePasswordReset,
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateFullName,
    clearErrors,
    isAnyLoading
  } = useAuthForms({
    redirectTo,
    onSuccess: () => {
      onAuthSuccess?.();
      navigate(redirectTo);
    },
    onError: (error) => {
      console.error('Auth error:', error);
    }
  });

  // 모드 변경시 에러 초기화
  useEffect(() => {
    clearErrors();
  }, [currentMode, clearErrors]);

  // 초대 토큰을 회원가입 폼에 설정
  useEffect(() => {
    if (inviteToken && !signUpForm.inviteToken) {
      setSignUpForm(prev => ({ ...prev, inviteToken }));
    }
  }, [inviteToken, signUpForm.inviteToken, setSignUpForm]);

  // 로그인 폼 제출 핸들러
  const onSignInSubmit = async (formData: SignInFormState) => {
    return await handleSignIn(formData);
  };

  // 회원가입 폼 제출 핸들러
  const onSignUpSubmit = async (formData: SignUpFormState) => {
    return await handleSignUp(formData);
  };

  // 비밀번호 찾기 핸들러
  const onForgotPassword = async () => {
    if (!signInForm.email) {
      alert('이메일을 먼저 입력해주세요.');
      return;
    }

    const result = await handlePasswordReset(signInForm.email);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  // 모드 변경 핸들러
  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setCurrentMode(newMode);
    clearErrors();
  };

  // 실시간 검증 함수들
  const getEmailError = (email: string): string | null => {
    return email ? validateEmail(email) : null;
  };

  const getPasswordError = (password: string): string | null => {
    return password ? validatePassword(password) : null;
  };

  const getPasswordConfirmError = (password: string, confirmPassword: string): string | null => {
    return confirmPassword ? validatePasswordConfirm(password, confirmPassword) : null;
  };

  const getFullNameError = (fullName: string): string | null => {
    return fullName ? validateFullName(fullName) : null;
  };

  if (isAuthenticated) {
    return null; // 이미 인증된 경우 아무것도 렌더링하지 않음
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        {/* 로딩 오버레이 */}
        {isAnyLoading() && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-700">처리 중...</span>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {currentMode === 'signin' ? '로그인' : '회원가입'}
          </h2>
          
          {/* 초대 토큰 알림 */}
          {inviteToken && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                🎉 초대를 받으셨습니다! 아래 정보를 입력하여 가입을 완료하세요.
              </p>
            </div>
          )}
          
          {/* 모드 전환 링크 */}
          {showToggle && !inviteToken && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {currentMode === 'signin' ? (
                <>
                  계정이 없으신가요?{' '}
                  <button
                    onClick={() => handleModeChange('signup')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => handleModeChange('signin')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    로그인
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* 인증 폼 */}
        <div className="bg-white rounded-lg shadow-md">
          {currentMode === 'signin' ? (
            <SignInForm
              onSubmit={onSignInSubmit}
              isLoading={signInState.isLoading}
              error={signInState.error}
              onForgotPassword={onForgotPassword}
              onSignUpRedirect={showToggle ? () => handleModeChange('signup') : undefined}
            />
          ) : (
            <SignUpForm
              onSubmit={onSignUpSubmit}
              isLoading={signUpState.isLoading}
              error={signUpState.error}
              inviteToken={inviteToken}
              onSignInRedirect={showToggle && !inviteToken ? () => handleModeChange('signin') : undefined}
            />
          )}
        </div>

        {/* 추가 정보 */}
        <div className="text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>로그인하시면 <a href="/terms" className="text-blue-600 hover:text-blue-500">이용약관</a>과 <a href="/privacy" className="text-blue-600 hover:text-blue-500">개인정보처리방침</a>에 동의한 것으로 간주됩니다.</p>
            
            {/* 도움말 링크 */}
            <div className="pt-4 space-x-4">
              <a href="/help" className="text-blue-600 hover:text-blue-500">
                도움말
              </a>
              <a href="/contact" className="text-blue-600 hover:text-blue-500">
                문의하기
              </a>
              {currentMode === 'signin' && (
                <button
                  onClick={onForgotPassword}
                  className="text-blue-600 hover:text-blue-500"
                >
                  비밀번호 찾기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 개발 모드 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-yellow-50 rounded-md">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">🛠 개발 모드 정보</p>
                <div className="space-y-1 text-xs">
                  <p>현재 모드: {currentMode}</p>
                  <p>리다이렉트: {redirectTo}</p>
                  {inviteToken && <p>초대 토큰: {inviteToken.substring(0, 8)}...</p>}
                  <p>로딩 상태: {isAnyLoading() ? '로딩 중' : '대기'}</p>
                </div>
              </div>
            </div>
            
            {/* Mock 로그인 버튼들 */}
            <MockLoginButtons />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthContainer;