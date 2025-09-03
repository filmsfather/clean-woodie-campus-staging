import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Input, Form, Card, Select } from '../../components/ui';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  context?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
    redirectUrl?: string;
  };
}

interface SignUpPageProps {
  redirectTo?: string;
}

/**
 * SignUpUseCase → SignUpPage
 * 회원가입 폼 UI 표면
 */
export const SignUpPage: React.FC<SignUpPageProps> = ({ redirectTo = '/dashboard' }) => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState<SignUpRequest>({
    email: '',
    password: '',
    name: '',
    role: 'student',
    context: {
      userAgent: navigator.userAgent,
      locale: navigator.language,
      redirectUrl: redirectTo,
    },
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // 비밀번호 확인 검증
    if (formData.password !== confirmPassword) {
      setErrors({ confirmPassword: '비밀번호가 일치하지 않습니다.' });
      setIsLoading(false);
      return;
    }

    try {
      await signUp(formData);
      navigate(redirectTo);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignUpRequest) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      // 입력 시 해당 필드 에러 제거
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  return (
    <FeatureGuard feature="signUp">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              새 계정 만들기
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              또는{' '}
              <Link
                to="/auth/signin"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                기존 계정으로 로그인
              </Link>
            </p>
          </div>

          <Card className="p-8">
            <Form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={errors.name}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일 주소
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="hong@example.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    역할
                  </label>
                  <Select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    error={errors.role}
                    disabled={isLoading}
                  >
                    <option value="student">학생</option>
                    <option value="teacher">교사</option>
                    <option value="admin">관리자</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    비밀번호
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="최소 8자 이상"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    error={errors.confirmPassword}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={!formData.email || !formData.password || !formData.name}
                >
                  {isLoading ? '계정 생성 중...' : '계정 만들기'}
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
};