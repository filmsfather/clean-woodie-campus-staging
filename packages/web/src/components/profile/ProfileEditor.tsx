import React, { useState, useCallback, useRef } from 'react';
import { UserRole } from '../../types/auth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

// 프로필 데이터 인터페이스
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  role: UserRole;
  classId?: string;
  avatar?: string;
  bio?: string;
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  academicInfo?: {
    grade?: string;
    subject?: string;
    institution?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 프로필 편집 모달 Props
interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  allowedFields?: string[]; // 편집 가능한 필드 제한
  readOnlyFields?: string[]; // 읽기 전용 필드
}

// 프로필 이미지 업로드 컴포넌트
interface ProfileImageUploadProps {
  currentAvatar?: string;
  onImageChange: (imageUrl: string) => void;
  disabled?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentAvatar,
  onImageChange,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      // 이미지 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);

      // TODO: 실제 이미지 업로드 API 호출
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await uploadAvatar(formData);
      // onImageChange(response.url);
      
      // Mock: 임시로 미리보기 URL 사용
      setTimeout(() => {
        onImageChange(previewUrl || '');
        setIsUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setIsUploading(false);
      // TODO: 에러 토스트 표시
    }
  }, [onImageChange, previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 형식 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      handleImageUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="프로필" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <span className="text-2xl">👤</span>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={triggerFileSelect}
        disabled={disabled || isUploading}
      >
        {isUploading ? '업로드 중...' : '이미지 변경'}
      </Button>
    </div>
  );
};

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  allowedFields,
  readOnlyFields = []
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'preferences'>('basic');

  // 필드 편집 가능 여부 확인
  const isFieldEditable = (fieldName: string): boolean => {
    if (readOnlyFields.includes(fieldName)) return false;
    if (allowedFields && !allowedFields.includes(fieldName)) return false;
    return true;
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 중첩 필드 변경 핸들러
  const handleNestedChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof UserProfile],
        [field]: value
      }
    }));
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 이름 검증
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = '이름은 필수입니다.';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '이름은 50자 이하여야 합니다.';
    }

    // 이메일 검증
    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = '이메일은 필수입니다.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다.';
      }
    }

    // 전화번호 검증 (선택사항)
    if (formData.contactInfo?.phone && formData.contactInfo.phone.trim().length > 0) {
      const phoneRegex = /^[0-9-+\s()]+$/;
      if (!phoneRegex.test(formData.contactInfo.phone)) {
        newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 처리
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      await onSave({
        ...formData,
        updatedAt: new Date()
      });
      onClose();
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      // TODO: 에러 토스트 표시
    } finally {
      setIsSaving(false);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    setFormData(profile);
    setErrors({});
    onClose();
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'student': return '학생';
      case 'teacher': return '교사';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="large">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">프로필 편집</h2>
          <Badge variant="outline">{getRoleLabel(profile.role)}</Badge>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'basic', label: '기본 정보' },
            { id: 'academic', label: '학술 정보' },
            { id: 'preferences', label: '설정' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[500px]">
          {/* 기본 정보 탭 */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* 프로필 이미지 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로필 사진</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileImageUpload
                    currentAvatar={formData.avatar}
                    onImageChange={(url) => handleInputChange('avatar', url)}
                    disabled={!isFieldEditable('avatar')}
                  />
                </CardContent>
              </Card>

              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-2">
                        이름 *
                      </label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="이름을 입력하세요"
                        error={errors.name}
                        disabled={!isFieldEditable('name')}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-2">
                        이메일 *
                      </label>
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="이메일을 입력하세요"
                        error={errors.email}
                        disabled={!isFieldEditable('email')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      전체 이름
                    </label>
                    <Input
                      value={formData.fullName || ''}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="전체 이름을 입력하세요"
                      disabled={!isFieldEditable('fullName')}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      자기소개
                    </label>
                    <Textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="간단한 자기소개를 작성하세요"
                      rows={3}
                      disabled={!isFieldEditable('bio')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 연락처 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>연락처 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      전화번호
                    </label>
                    <Input
                      type="tel"
                      value={formData.contactInfo?.phone || ''}
                      onChange={(e) => handleNestedChange('contactInfo', 'phone', e.target.value)}
                      placeholder="전화번호를 입력하세요"
                      error={errors.phone}
                      disabled={!isFieldEditable('contactInfo')}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      주소
                    </label>
                    <Textarea
                      value={formData.contactInfo?.address || ''}
                      onChange={(e) => handleNestedChange('contactInfo', 'address', e.target.value)}
                      placeholder="주소를 입력하세요"
                      rows={2}
                      disabled={!isFieldEditable('contactInfo')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 학술 정보 탭 */}
          {activeTab === 'academic' && (
            <Card>
              <CardHeader>
                <CardTitle>학술 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.role === 'student' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-2">
                        학년
                      </label>
                      <Select
                        value={formData.academicInfo?.grade || ''}
                        onChange={(value) => handleNestedChange('academicInfo', 'grade', value)}
                        disabled={!isFieldEditable('academicInfo')}
                      >
                        <option value="">학년을 선택하세요</option>
                        <option value="1">1학년</option>
                        <option value="2">2학년</option>
                        <option value="3">3학년</option>
                        <option value="4">4학년</option>
                        <option value="5">5학년</option>
                        <option value="6">6학년</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-2">
                        반 ID
                      </label>
                      <Input
                        value={formData.classId || ''}
                        onChange={(e) => handleInputChange('classId', e.target.value)}
                        placeholder="반 ID를 입력하세요"
                        disabled={!isFieldEditable('classId')}
                      />
                    </div>
                  </>
                )}

                {profile.role === 'teacher' && (
                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      담당 과목
                    </label>
                    <Input
                      value={formData.academicInfo?.subject || ''}
                      onChange={(e) => handleNestedChange('academicInfo', 'subject', e.target.value)}
                      placeholder="담당 과목을 입력하세요"
                      disabled={!isFieldEditable('academicInfo')}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    소속 기관
                  </label>
                  <Input
                    value={formData.academicInfo?.institution || ''}
                    onChange={(e) => handleNestedChange('academicInfo', 'institution', e.target.value)}
                    placeholder="소속 기관을 입력하세요"
                    disabled={!isFieldEditable('academicInfo')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 설정 탭 */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>개인 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      언어
                    </label>
                    <Select
                      value={formData.preferences?.language || 'ko'}
                      onChange={(value) => handleNestedChange('preferences', 'language', value)}
                      disabled={!isFieldEditable('preferences')}
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="zh">中文</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary block mb-2">
                      시간대
                    </label>
                    <Select
                      value={formData.preferences?.timezone || 'Asia/Seoul'}
                      onChange={(value) => handleNestedChange('preferences', 'timezone', value)}
                      disabled={!isFieldEditable('preferences')}
                    >
                      <option value="Asia/Seoul">서울 (GMT+9)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="America/New_York">뉴욕 (GMT-5)</option>
                      <option value="Europe/London">런던 (GMT+0)</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    테마
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: '라이트', icon: '☀️' },
                      { value: 'dark', label: '다크', icon: '🌙' },
                      { value: 'auto', label: '자동', icon: '🔄' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => handleNestedChange('preferences', 'theme', theme.value)}
                        disabled={!isFieldEditable('preferences')}
                        className={`p-3 text-center rounded-lg border-2 transition-colors ${
                          formData.preferences?.theme === theme.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!isFieldEditable('preferences') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-2xl mb-1">{theme.icon}</div>
                        <div className="text-sm font-medium">{theme.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">이메일 알림</label>
                      <p className="text-xs text-text-secondary">중요한 업데이트를 이메일로 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.preferences?.emailNotifications ?? true}
                      onChange={(e) => handleNestedChange('preferences', 'emailNotifications', e.target.checked)}
                      disabled={!isFieldEditable('preferences')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">푸시 알림</label>
                      <p className="text-xs text-text-secondary">실시간 알림을 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.preferences?.pushNotifications ?? true}
                      onChange={(e) => handleNestedChange('preferences', 'pushNotifications', e.target.checked)}
                      disabled={!isFieldEditable('preferences')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '프로필 저장'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileEditor;