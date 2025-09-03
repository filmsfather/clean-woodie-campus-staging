import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Input, Card, Select, Avatar } from '../../components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface ProfileDto {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  initials: string;
  role: string;
  schoolId?: string;
  gradeLevel?: number;
  avatarUrl?: string;
  hasAvatar: boolean;
  settings: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      showEmail: boolean;
      showActivity: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileDto {
  userId: string;
  fullName?: string;
  gradeLevel?: number;
  avatarUrl?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showActivity?: boolean;
    };
  };
}

/**
 * GetProfileUseCase & UpdateProfileUseCase → ProfilePage
 * 프로필 조회 및 수정 UI 표면
 */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UpdateProfileDto>>({});

  // GetProfileUseCase 호출
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<ProfileDto> => {
      // TODO: 실제 GetProfileUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock 프로필 데이터 (Application DTO 형태)
      return {
        id: user?.id || 'user-1',
        email: user?.email || 'student@example.com',
        fullName: user?.name || '김학생',
        displayName: user?.name || '김학생',
        initials: '김학',
        role: user?.role || 'student',
        gradeLevel: 10,
        hasAvatar: false,
        settings: {
          theme: 'auto',
          language: 'ko',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            showEmail: false,
            showActivity: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    enabled: !!user?.id
  });

  // UpdateProfileUseCase 호출
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: UpdateProfileDto) => {
      // TODO: 실제 UpdateProfileUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...profile, ...updateData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setEditData({});
    }
  });

  const handleEdit = () => {
    if (!profile) return;
    
    setEditData({
      userId: profile.id,
      fullName: profile.fullName,
      gradeLevel: profile.gradeLevel,
      settings: profile.settings
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.userId) return;
    await updateProfileMutation.mutateAsync(editData as UpdateProfileDto);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (category: string, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...(prev.settings as any)?.[category],
          [field]: value
        }
      }
    }));
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">프로필을 불러올 수 없습니다.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGuard feature="profile">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">내 프로필</h1>
          {!isEditing && (
            <Button onClick={handleEdit}>프로필 수정</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 프로필 정보 */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar
                name={profile.displayName}
                src={profile.avatarUrl}
                size="xl"
              />
              <div>
                <h2 className="text-xl font-semibold">{profile.displayName}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profile.role === 'student' ? '학생' : 
                   profile.role === 'teacher' ? '교사' : '관리자'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이름</label>
                    <Input
                      value={editData.fullName || ''}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  
                  {profile.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">학년</label>
                      <Select
                        value={editData.gradeLevel?.toString() || ''}
                        onChange={(e) => handleInputChange('gradeLevel', parseInt(e.target.value))}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}학년
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSave} 
                      loading={updateProfileMutation.isPending}
                    >
                      저장
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이름</label>
                    <p className="mt-1">{profile.fullName}</p>
                  </div>
                  
                  {profile.gradeLevel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">학년</label>
                      <p className="mt-1">{profile.gradeLevel}학년</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">가입일</label>
                    <p className="mt-1">{new Date(profile.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* 설정 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">설정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">테마</label>
                {isEditing ? (
                  <Select
                    value={editData.settings?.theme || profile.settings.theme}
                    onChange={(e) => handleSettingChange('theme', 'theme', e.target.value)}
                  >
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                    <option value="auto">시스템</option>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">{
                    profile.settings.theme === 'light' ? '라이트' :
                    profile.settings.theme === 'dark' ? '다크' : '시스템'
                  }</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">언어</label>
                {isEditing ? (
                  <Select
                    value={editData.settings?.language || profile.settings.language}
                    onChange={(e) => handleSettingChange('language', 'language', e.target.value)}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">
                    {profile.settings.language === 'ko' ? '한국어' : 'English'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">알림</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.settings?.notifications?.email ?? profile.settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm">이메일 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.settings?.notifications?.push ?? profile.settings.notifications.push}
                      onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm">푸시 알림</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
};