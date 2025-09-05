import React, { useState } from 'react';
import { SignInFormState, AuthActionResult } from '../../types/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { AuthFeatureGuard } from './FeatureGuard';

interface SignInFormProps {
  onSubmit: (formData: SignInFormState) => Promise<AuthActionResult>;
  isLoading: boolean;
  error: string | null;
  onForgotPassword?: () => void;
  onSignUpRedirect?: () => void;
}

/**
 * SignInForm - SignInUseCase에 대응하는 로그인 폼 컴포넌트
 * 
 * Clean Architecture 준수:
 * - UI는 순수하게 사용자 입력만 처리, 비즈니스 로직은 UseCase로 위임
 * - DTO-First: SignInFormState 타입으로 Application Layer와 일관성
 * - 도메인 규칙을 UI 검증에 반영 (이메일 형식, 비밀번호 최소 길이 등)
 */
export const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onForgotPassword,
  onSignUpRedirect
}) => {
  // 폼 상태 - Application Layer의 DTO 구조와 동일
  const [formState, setFormState] = useState<SignInFormState>({
    email: '',
    password: '',
    rememberMe: false
  });

  // 폼 검증 상태
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // 입력값 변경 핸들러
  const handleInputChange = (field: keyof SignInFormState, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));

    // 실시간 검증 - 도메인 규칙 반영
    if (field === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidationErrors(prev => ({
        ...prev,
        email: !emailRegex.test(value) && value.length > 0 ? '유효한 이메일 주소를 입력해주세요' : undefined
      }));
    }

    if (field === 'password' && typeof value === 'string') {
      setValidationErrors(prev => ({
        ...prev,
        password: value.length < 6 && value.length > 0 ? '비밀번호는 최소 6자 이상이어야 합니다' : undefined
      }));
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 최종 검증
    const errors: typeof validationErrors = {};
    
    if (!formState.email) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = '유효한 이메일 주소를 입력해주세요';
    }

    if (!formState.password) {
      errors.password = '비밀번호를 입력해주세요';
    } else if (formState.password.length < 6) {
      errors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // UseCase 호출
    await onSubmit(formState);
  };

  // 폼 유효성 체크
  const isFormValid = formState.email && formState.password && 
                     !validationErrors.email && !validationErrors.password;

  return (
    <AuthFeatureGuard.SignIn>
      <Card className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 폼 제목 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
            <p className="text-sm text-gray-600 mt-2">
              계정에 로그인하여 시작하세요
            </p>
          </div>

          {/* 서버 에러 표시 */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              error={validationErrors.email}
              autoComplete="email"
              required
            />
            {validationErrors.email && (
              <p className="text-xs text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <Input
              id="password"
              type="password"
              value={formState.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
              error={validationErrors.password}
              autoComplete="current-password"
              required
            />
            {validationErrors.password && (
              <p className="text-xs text-red-600">{validationErrors.password}</p>
            )}
          </div>

          {/* 추가 옵션 */}
          <div className="flex items-center justify-between">
            <Checkbox
              id="rememberMe"
              checked={formState.rememberMe}
              onCheckedChange={(checked) => handleInputChange('rememberMe', checked)}
              label="로그인 상태 유지"
              disabled={isLoading}
            />

            {/* 비밀번호 재설정 링크 - Feature Flag로 제어 */}
            <AuthFeatureGuard.PasswordReset>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </AuthFeatureGuard.PasswordReset>
          </div>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full"
            loading={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          {/* 회원가입 링크 - Feature Flag로 제어 */}
          <AuthFeatureGuard.SignUp>
            {onSignUpRedirect && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={onSignUpRedirect}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                  >
                    회원가입
                  </button>
                </p>
              </div>
            )}
          </AuthFeatureGuard.SignUp>
        </form>
      </Card>
    </AuthFeatureGuard.SignIn>
  );
};

export default SignInForm;