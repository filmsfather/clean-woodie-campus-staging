// 프로필 생성 요청 DTO (회원가입 시)
export interface CreateProfileDto {
  userId: string; // auth.users.id (Supabase에서 생성된 ID)
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number; // 학생인 경우만
}

// 프로필 업데이트 요청 DTO
export interface UpdateProfileDto {
  userId: string; // 업데이트할 프로필의 사용자 ID
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

// 프로필 응답 DTO
export interface ProfileDto {
  id: string;
  email: string;
  fullName: string;
  displayName: string; // 표시용 이름
  initials: string; // 아바타용 이니셜
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
  createdAt: string; // ISO 날짜 문자열
  updatedAt: string;
}

// 프로필 조회 요청 DTO
export interface GetProfileDto {
  userId: string;
}

// 프로필 목록 조회 요청 DTO (관리자용)
export interface ListProfilesDto {
  schoolId?: string;
  role?: 'student' | 'teacher' | 'admin';
  gradeLevel?: number;
  page?: number;
  limit?: number;
}

// 프로필 목록 응답 DTO
export interface ProfileListDto {
  profiles: ProfileDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 역할 변경 요청 DTO (관리자만)
export interface ChangeRoleDto {
  userId: string;
  targetUserId: string; // 역할을 변경할 사용자
  newRole: 'student' | 'teacher' | 'admin';
}