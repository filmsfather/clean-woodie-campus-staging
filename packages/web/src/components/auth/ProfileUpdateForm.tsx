import React, { useState, useEffect } from 'react';
import { UpdateProfileFormState, ProfileDto, AuthActionResult } from '../../types/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Avatar } from '../ui/Avatar';
import { AuthFeatureGuard } from './FeatureGuard';

interface ProfileUpdateFormProps {
  currentProfile: ProfileDto;
  onSubmit: (formData: UpdateProfileFormState) => Promise<AuthActionResult>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  canUploadAvatar?: boolean;
}

/**
 * ProfileUpdateForm - UpdateProfileUseCase에 대응하는 프로필 수정 폼
 * 
 * Clean Architecture & DDD 준수:
 * - Domain Entity의 불변성 보장: 기존 프로필을 변경하지 않고 새로운 DTO 생성
 * - Aggregate 완전성: 모든 관련 설정을 하나의 폼에서 관리
 * - 비즈니스 규칙: 역할별 수정 가능 필드, 데이터 유효성 검증 등
 * - UI 상태와 Domain 상태 분리: 폼 상태는 UI만을 위한 것
 */
export const ProfileUpdateForm: React.FC<ProfileUpdateFormProps> = ({
  currentProfile,
  onSubmit,
  onCancel,
  isLoading,
  error,
  canUploadAvatar = false
}) => {
  // 폼 상태 초기화 - 현재 프로필 데이터로부터
  const [formState, setFormState] = useState<UpdateProfileFormState>({
    fullName: currentProfile.fullName,
    gradeLevel: currentProfile.gradeLevel,
    avatarUrl: currentProfile.avatarUrl,
    settings: {
      theme: (currentProfile.settings.theme as "light" | "dark" | "auto"),
      language: currentProfile.settings.language,
      notifications: {
        email: currentProfile.settings.notifications.email,
        push: currentProfile.settings.notifications.push,
        sms: currentProfile.settings.notifications.sms
      },
      privacy: {
        showEmail: currentProfile.settings.privacy.showEmail,
        showActivity: currentProfile.settings.privacy.showActivity
      }
    }
  });

  // 검증 에러 상태
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    gradeLevel?: string;
  }>({});

  // 변경사항 감지
  const [hasChanges, setHasChanges] = useState(false);

  // 변경사항 감지 Effect
  useEffect(() => {
    const isChanged = 
      formState.fullName !== currentProfile.fullName ||
      formState.gradeLevel !== currentProfile.gradeLevel ||
      formState.avatarUrl !== currentProfile.avatarUrl ||
      formState.settings.theme !== currentProfile.settings.theme ||
      formState.settings.language !== currentProfile.settings.language ||
      formState.settings.notifications.email !== currentProfile.settings.notifications.email ||
      formState.settings.notifications.push !== currentProfile.settings.notifications.push ||
      formState.settings.notifications.sms !== currentProfile.settings.notifications.sms ||
      formState.settings.privacy.showEmail !== currentProfile.settings.privacy.showEmail ||
      formState.settings.privacy.showActivity !== currentProfile.settings.privacy.showActivity;

    setHasChanges(isChanged);
  }, [formState, currentProfile]);

  // 기본 정보 변경 핸들러
  const handleBasicInfoChange = (field: string, value: string | number | undefined) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));

    // 실시간 검증 - 도메인 규칙
    if (field === 'fullName' && typeof value === 'string') {
      setValidationErrors(prev => ({
        ...prev,
        fullName: value.trim().length < 2 ? '이름은 최소 2자 이상이어야 합니다' : undefined
      }));
    }

    if (field === 'gradeLevel' && typeof value === 'number') {
      setValidationErrors(prev => ({
        ...prev,
        gradeLevel: (value < 1 || value > 12) ? '학년은 1-12 사이여야 합니다' : undefined
      }));
    }
  };

  // 설정 변경 핸들러
  const handleSettingsChange = (category: string, field: string, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...(prev.settings[category as keyof typeof prev.settings] as object),
          [field]: value
        }
      }
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 최종 검증 - 비즈니스 규칙
    const errors: typeof validationErrors = {};

    if (!formState.fullName.trim()) {
      errors.fullName = '이름을 입력해주세요';
    } else if (formState.fullName.trim().length < 2) {
      errors.fullName = '이름은 최소 2자 이상이어야 합니다';
    }

    // 학생인 경우 학년 필수 - 도메인 규칙
    if (currentProfile.role === 'student' && !formState.gradeLevel) {
      errors.gradeLevel = '학생은 학년 정보가 필요합니다';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // UseCase 호출 - 변경된 필드만 전달
    const updateData: UpdateProfileFormState = {
      fullName: formState.fullName,
      gradeLevel: formState.gradeLevel,
      avatarUrl: formState.avatarUrl,
      settings: formState.settings
    };

    await onSubmit(updateData);
  };

  // 폼 초기화
  const handleReset = () => {
    setFormState({
      fullName: currentProfile.fullName,
      gradeLevel: currentProfile.gradeLevel,
      avatarUrl: currentProfile.avatarUrl,
      settings: {
        theme: (currentProfile.settings.theme as "light" | "dark" | "auto"),
        language: currentProfile.settings.language,
        notifications: {
          email: currentProfile.settings.notifications.email,
          push: currentProfile.settings.notifications.push,
          sms: currentProfile.settings.notifications.sms
        },
        privacy: {
          showEmail: currentProfile.settings.privacy.showEmail,
          showActivity: currentProfile.settings.privacy.showActivity
        }
      }
    });
    setValidationErrors({});
  };

  return (
    <AuthFeatureGuard.ProfileUpdate>
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 폼 제목 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">프로필 수정</h2>
            <p className="text-sm text-gray-600 mt-2">
              개인 정보와 설정을 업데이트하세요
            </p>
          </div>

          {/* 서버 에러 표시 */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* 아바터 섹션 */}
          <div className="text-center">
            <Avatar
              src={formState.avatarUrl}
              alt={formState.fullName}
              size="xl"
              initials={currentProfile.initials}
              hasAvatar={!!formState.avatarUrl}
            />
            {canUploadAvatar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={isLoading}
              >
                프로필 사진 변경
              </Button>
            )}
          </div>

          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
            
            {/* 이름 */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                전체 이름 *
              </label>
              <Input
                id="fullName"
                type="text"
                value={formState.fullName}
                onChange={(e) => handleBasicInfoChange('fullName', e.target.value)}
                disabled={isLoading}
                error={validationErrors.fullName}
                required
              />
              {validationErrors.fullName && (
                <p className="text-xs text-red-600">{validationErrors.fullName}</p>
              )}
            </div>

            {/* 학년 - 학생인 경우만 */}
            {currentProfile.role === 'student' && (
              <div className="space-y-2">
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
                  학년 *
                </label>
                <Select
                  value={formState.gradeLevel?.toString() || ''}
                  onValueChange={(value) => handleBasicInfoChange('gradeLevel', value ? parseInt(value) : undefined)}
                  disabled={isLoading}
                >
                  <option value="">학년을 선택하세요</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <option key={grade} value={grade.toString()}>
                      {grade}학년
                    </option>
                  ))}
                </Select>
                {validationErrors.gradeLevel && (
                  <p className="text-xs text-red-600">{validationErrors.gradeLevel}</p>
                )}
              </div>
            )}
          </div>

          {/* 시스템 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">시스템 설정</h3>
            
            {/* 테마 설정 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">테마</label>
              <Select
                value={formState.settings.theme}
                onValueChange={(value) => handleSettingsChange('', 'theme', value)}
                disabled={isLoading}
              >
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="auto">시스템 설정 따르기</option>
              </Select>
            </div>

            {/* 언어 설정 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">언어</label>
              <Select
                value={formState.settings.language}
                onValueChange={(value) => handleSettingsChange('', 'language', value)}
                disabled={isLoading}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
            
            <div className="space-y-3">
              <Checkbox
                id="emailNotifications"
                checked={formState.settings.notifications.email}
                onCheckedChange={(checked) => handleSettingsChange('notifications', 'email', checked)}
                label="이메일 알림"
                disabled={isLoading}
              />
              
              <Checkbox
                id="pushNotifications"
                checked={formState.settings.notifications.push}
                onCheckedChange={(checked) => handleSettingsChange('notifications', 'push', checked)}
                label="푸시 알림"
                disabled={isLoading}
              />
              
              <Checkbox
                id="smsNotifications"
                checked={formState.settings.notifications.sms}
                onCheckedChange={(checked) => handleSettingsChange('notifications', 'sms', checked)}
                label="SMS 알림"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 개인정보 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">개인정보 설정</h3>
            
            <div className="space-y-3">
              <Checkbox
                id="showEmail"
                checked={formState.settings.privacy.showEmail}
                onCheckedChange={(checked) => handleSettingsChange('privacy', 'showEmail', checked)}
                label="다른 사용자에게 이메일 공개"
                disabled={isLoading}
              />
              
              <Checkbox
                id="showActivity"
                checked={formState.settings.privacy.showActivity}
                onCheckedChange={(checked) => handleSettingsChange('privacy', 'showActivity', checked)}
                label="활동 내역 공개"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading || !hasChanges}
              >
                초기화
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>

            <Button
              type="submit"
              disabled={!hasChanges || isLoading || Object.keys(validationErrors).length > 0}
              loading={isLoading}
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </Button>
          </div>

          {/* 변경사항 알림 */}
          {hasChanges && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                💡 변경사항이 있습니다. 저장하기 버튼을 클릭하여 적용하세요.
              </p>
            </div>
          )}
        </form>
      </Card>
    </AuthFeatureGuard.ProfileUpdate>
  );
};

export default ProfileUpdateForm;