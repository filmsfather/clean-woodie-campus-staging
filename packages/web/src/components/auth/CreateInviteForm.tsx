import React, { useState } from 'react';
import { CreateInviteFormState, AuthActionResult } from '../../types/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { InviteFeatureGuard } from './FeatureGuard';

interface CreateInviteFormProps {
  onSubmit: (formData: CreateInviteFormState) => Promise<AuthActionResult>;
  isLoading: boolean;
  error: string | null;
  organizationId: string;
  createdBy: string;
  availableClasses?: Array<{ id: string; name: string }>;
}

/**
 * CreateInviteForm - CreateInviteUseCase에 대응하는 초대 생성 폼
 * 
 * DDD 원칙 준수:
 * - 도메인 규칙을 UI 검증에 반영: 이메일 형식, 학생 역할시 클래스 필수 등
 * - Aggregate 완전성: CreateInviteDto의 모든 필수 필드 수집
 * - 비즈니스 규칙: 만료일 범위, 역할별 제약사항 등을 UI에서 강제
 */
export const CreateInviteForm: React.FC<CreateInviteFormProps> = ({
  onSubmit,
  isLoading,
  error,
  organizationId: _organizationId,
  createdBy: _createdBy,
  availableClasses = []
}) => {
  // 폼 상태 - Application Layer DTO와 동일 구조
  const [formState, setFormState] = useState<CreateInviteFormState>({
    email: '',
    role: 'student',
    classId: '',
    expiryDays: 7 // 기본값: 7일
  });

  // 검증 에러 상태
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    role?: string;
    classId?: string;
    expiryDays?: string;
  }>({});

  // 입력값 변경 핸들러
  const handleInputChange = (field: keyof CreateInviteFormState, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));

    // 실시간 검증 - 도메인 규칙 적용
    if (field === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidationErrors(prev => ({
        ...prev,
        email: !emailRegex.test(value) && value.length > 0 ? '유효한 이메일 주소를 입력해주세요' : undefined
      }));
    }

    if (field === 'role') {
      // 학생이 아닌 경우 classId 초기화
      if (value !== 'student') {
        setFormState(prev => ({ ...prev, classId: '' }));
      }
      setValidationErrors(prev => ({
        ...prev,
        classId: undefined
      }));
    }

    if (field === 'expiryDays' && typeof value === 'number') {
      setValidationErrors(prev => ({
        ...prev,
        expiryDays: (value < 1 || value > 30) ? '만료일은 1일에서 30일 사이여야 합니다' : undefined
      }));
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 비즈니스 규칙 검증
    const errors: typeof validationErrors = {};

    // 이메일 검증
    if (!formState.email) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = '유효한 이메일 주소를 입력해주세요';
    }

    // 역할 검증
    if (!formState.role) {
      errors.role = '역할을 선택해주세요';
    }

    // 학생 역할시 클래스 필수 - 도메인 규칙
    if (formState.role === 'student' && (availableClasses || []).length > 0 && !formState.classId) {
      errors.classId = '학생 초대시 클래스를 선택해주세요';
    }

    // 만료일 검증 - 비즈니스 규칙
    if (formState.expiryDays < 1 || formState.expiryDays > 30) {
      errors.expiryDays = '만료일은 1일에서 30일 사이여야 합니다';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // UseCase로 전달할 데이터 구성 - CreateInviteDto 형태
    await onSubmit(formState);
  };

  // 폼 유효성 체크
  const isFormValid = formState.email && formState.role && 
                     (formState.role !== 'student' || !(availableClasses || []).length || formState.classId) &&
                     !Object.keys(validationErrors).some(key => validationErrors[key as keyof typeof validationErrors]);

  return (
    <InviteFeatureGuard.Creation>
      <Card className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 폼 제목 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">사용자 초대</h2>
            <p className="text-sm text-gray-600 mt-2">
              새로운 사용자를 조직에 초대하세요
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
              이메일 주소 *
            </label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="초대할 사용자의 이메일"
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
              역할 *
            </label>
            <Select
              value={formState.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled={isLoading}
              options={[
                { value: 'student', label: '학생' },
                { value: 'teacher', label: '교사' },
                { value: 'admin', label: '관리자' }
              ]}
            />
            {validationErrors.role && (
              <p className="text-xs text-red-600">{validationErrors.role}</p>
            )}
            
            {/* 역할별 설명 */}
            <div className="text-xs text-gray-500">
              {formState.role === 'student' && '학습자로서 문제를 풀고 진도를 관리할 수 있습니다'}
              {formState.role === 'teacher' && '문제를 출제하고 학생들의 진도를 관리할 수 있습니다'}
              {formState.role === 'admin' && '시스템 전체를 관리하고 사용자를 관리할 수 있습니다'}
            </div>
          </div>

          {/* 클래스 선택 - 학생 역할일 때만 표시 */}
          {formState.role === 'student' && (availableClasses || []).length > 0 && (
            <div className="space-y-2">
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
                클래스 *
              </label>
              <Select
                value={formState.classId}
                onChange={(e) => handleInputChange('classId', e.target.value)}
                disabled={isLoading}
                placeholder="클래스를 선택하세요"
                options={(availableClasses || []).map((cls) => ({
                  value: cls.id,
                  label: cls.name
                }))}
              />
              {validationErrors.classId && (
                <p className="text-xs text-red-600">{validationErrors.classId}</p>
              )}
            </div>
          )}

          {/* 만료일 설정 */}
          <div className="space-y-2">
            <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700">
              초대 유효기간 (일)
            </label>
            <Input
              id="expiryDays"
              type="number"
              min={1}
              max={30}
              value={formState.expiryDays}
              onChange={(e) => handleInputChange('expiryDays', parseInt(e.target.value))}
              disabled={isLoading}
              error={validationErrors.expiryDays}
            />
            {validationErrors.expiryDays && (
              <p className="text-xs text-red-600">{validationErrors.expiryDays}</p>
            )}
            <p className="text-xs text-gray-500">
              초대 링크가 유효한 기간을 설정합니다 (1-30일)
            </p>
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full"
            loading={isLoading}
          >
            {isLoading ? '초대 생성 중...' : '초대 보내기'}
          </Button>

          {/* 도움말 텍스트 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              💡 초대 링크가 지정된 이메일로 전송됩니다. 사용자는 링크를 통해 계정을 생성하고 조직에 참여할 수 있습니다.
            </p>
          </div>
        </form>
      </Card>
    </InviteFeatureGuard.Creation>
  );
};

export default CreateInviteForm;