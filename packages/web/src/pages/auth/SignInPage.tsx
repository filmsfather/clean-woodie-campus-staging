import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Input, Form, Card } from '../../components/ui';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface SignInRequest {
  email: string;
  password: string;
  context?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
    redirectUrl?: string;
  };
}

interface SignInPageProps {
  redirectTo?: string;
}

/**
 * SignInUseCase → SignInPage
 * 로그인 폼 UI 표면
 */
export const SignInPage: React.FC<SignInPageProps> = ({ redirectTo = '/dashboard' }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState<SignInRequest>({
    email: '',
    password: '',
    context: {
      userAgent: navigator.userAgent,
      locale: navigator.language,
      redirectUrl: redirectTo,
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await signIn(formData);
      navigate(redirectTo);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Pick<SignInRequest, 'email' | 'password'>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      // 입력 시 해당 필드 에러 제거
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  return (
    <FeatureGuard feature="signIn">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              계정에 로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              또는{' '}
              <Link
                to="/auth/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                새 계정 만들기
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
                  <label htmlFor="email" className="sr-only">
                    이메일 주소
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="이메일 주소"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    비밀번호
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="비밀번호"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm">
                  <Link
                    to="/auth/reset-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={!formData.email || !formData.password}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
};