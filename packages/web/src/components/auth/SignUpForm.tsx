import React, { useState } from 'react';
import { SignUpFormState, AuthActionResult } from '../../types/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { AuthFeatureGuard } from './FeatureGuard';

interface SignUpFormProps {
  onSubmit: (formData: SignUpFormState) => Promise<AuthActionResult>;
  isLoading: boolean;
  error: string | null;
  inviteToken?: string | null;
  onSignInRedirect?: () => void;
}

/**
 * SignUpForm - SignUpUseCase에 대응하는 회원가입 폼 컴포넌트
 * 
 * Clean Architecture 준수:
 * - UI는 순수하게 사용자 입력만 처리, 비즈니스 로직은 UseCase로 위임
 * - DTO-First: SignUpFormState 타입으로 Application Layer와 일관성
 * - 도메인 규칙을 UI 검증에 반영 (이메일 형식, 비밀번호 최소 길이 등)
 */
export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  isLoading,
  error,
  inviteToken,
  onSignInRedirect
}) => {
  // 폼 상태 - Application Layer의 DTO 구조와 동일
  const [formState, setFormState] = useState<SignUpFormState>({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
    schoolId: undefined,
    gradeLevel: undefined,
    inviteToken: inviteToken || undefined
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  // 폼 검증 상태
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    role?: string;
    gradeLevel?: string;
  }>({});

  // 입력값 변경 핸들러
  const handleInputChange = (field: keyof SignUpFormState, value: string | number | undefined) => {
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
        password: value.length < 8 && value.length > 0 ? '비밀번호는 최소 8자 이상이어야 합니다' : undefined
      }));
      
      // 비밀번호 확인 재검증
      if (confirmPassword && confirmPassword !== value) {
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: '비밀번호가 일치하지 않습니다'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: undefined
        }));
      }
    }

    if (field === 'fullName' && typeof value === 'string') {
      setValidationErrors(prev => ({
        ...prev,
        fullName: value.length < 2 && value.length > 0 ? '이름은 최소 2자 이상이어야 합니다' : undefined
      }));
    }
  };

  // 비밀번호 확인 핸들러
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    
    setValidationErrors(prev => ({
      ...prev,
      confirmPassword: formState.password && formState.password !== value ? '비밀번호가 일치하지 않습니다' : undefined
    }));
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
    } else if (formState.password.length < 8) {
      errors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    }

    if (!confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formState.password !== confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formState.fullName) {
      errors.fullName = '이름을 입력해주세요';
    } else if (formState.fullName.length < 2) {
      errors.fullName = '이름은 최소 2자 이상이어야 합니다';
    }

    if (!formState.role) {
      errors.role = '역할을 선택해주세요';
    }

    // 학생인 경우 학년 필수
    if (formState.role === 'student' && !formState.gradeLevel) {
      errors.gradeLevel = '학년을 선택해주세요';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // UseCase 호출
    await onSubmit(formState);
  };

  // 폼 유효성 체크
  const isFormValid = formState.email && formState.password && confirmPassword &&
                     formState.fullName && formState.role &&
                     (formState.role !== 'student' || formState.gradeLevel) &&
                     !Object.values(validationErrors).some(error => error);

  return (
    <AuthFeatureGuard.SignUp>
      <Card className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 폼 제목 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
            <p className="text-sm text-gray-600 mt-2">
              {inviteToken ? '초대를 완료하세요' : '새 계정을 만들어 시작하세요'}
            </p>
          </div>

          {/* 초대 토큰 알림 */}
          {inviteToken && (
            <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md border border-blue-200">
              🎉 초대를 받으셨습니다! 아래 정보를 입력하여 가입을 완료하세요.
            </div>
          )}

          {/* 서버 에러 표시 */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* 이름 입력 */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              value={formState.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="홍길동"
              disabled={isLoading}
              error={validationErrors.fullName}
              autoComplete="name"
              required
            />
            {validationErrors.fullName && (
              <p className="text-xs text-red-600">{validationErrors.fullName}</p>
            )}
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일 <span className="text-red-500">*</span>
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

          {/* 역할 선택 */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              역할 <span className="text-red-500">*</span>
            </label>
            <Select
              id="role"
              value={formState.role}
              onChange={(e) => handleInputChange('role', e.target.value as 'student' | 'teacher' | 'admin')}
              disabled={isLoading || !!inviteToken} // 초대 토큰이 있으면 역할 변경 불가
              error={validationErrors.role}
              required
              options={[
                { value: 'student', label: '학생' },
                { value: 'teacher', label: '교사' },
                { value: 'admin', label: '관리자' }
              ]}
              placeholder="역할을 선택하세요"
            />
            {validationErrors.role && (
              <p className="text-xs text-red-600">{validationErrors.role}</p>
            )}
          </div>

          {/* 학년 선택 (학생인 경우만) */}
          {formState.role === 'student' && (
            <div className="space-y-2">
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
                학년 <span className="text-red-500">*</span>
              </label>
              <Select
                id="gradeLevel"
                value={formState.gradeLevel?.toString() || ''}
                onChange={(e) => handleInputChange('gradeLevel', parseInt(e.target.value) || undefined)}
                disabled={isLoading}
                error={validationErrors.gradeLevel}
                required
                options={[
                  ...Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: `${i + 1}학년`
                  }))
                ]}
                placeholder="학년을 선택하세요"
              />
              {validationErrors.gradeLevel && (
                <p className="text-xs text-red-600">{validationErrors.gradeLevel}</p>
              )}
            </div>
          )}

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <Input
              id="password"
              type="password"
              value={formState.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="최소 8자 이상"
              disabled={isLoading}
              error={validationErrors.password}
              autoComplete="new-password"
              required
            />
            {validationErrors.password && (
              <p className="text-xs text-red-600">{validationErrors.password}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isLoading}
              error={validationErrors.confirmPassword}
              autoComplete="new-password"
              required
            />
            {validationErrors.confirmPassword && (
              <p className="text-xs text-red-600">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full"
            loading={isLoading}
          >
            {isLoading ? '계정 생성 중...' : '계정 만들기'}
          </Button>

          {/* 로그인 링크 */}
          {onSignInRedirect && !inviteToken && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={onSignInRedirect}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                >
                  로그인
                </button>
              </p>
            </div>
          )}
        </form>
      </Card>
    </AuthFeatureGuard.SignUp>
  );
};

export default SignUpForm;