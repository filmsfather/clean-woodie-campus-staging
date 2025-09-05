// DTO types shared between Application layer and Web layer
// These types are directly imported from the Application package

// Application layer 타입들 - 실제 연결 전까지 임시 정의
export interface CreateProfileDto {
  userId: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number;
}

export interface UpdateProfileDto {
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

export interface GetProfileDto {
  userId: string;
}

export interface ListProfilesDto {
  schoolId?: string;
  role?: 'student' | 'teacher' | 'admin';
  gradeLevel?: number;
  page?: number;
  limit?: number;
}

export interface ProfileListDto {
  profiles: ProfileDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ChangeRoleDto {
  userId: string;
  targetUserId: string;
  newRole: 'student' | 'teacher' | 'admin';
}

export interface CreateInviteDto {
  email: string;
  role: 'student' | 'teacher' | 'admin';
  organizationId: string;
  classId?: string;
  createdBy: string;
  expiryDays?: number;
}

export interface ValidateInviteTokenDto {
  token: string;
}

export interface InviteTokenValidationDto {
  isValid: boolean;
  invite?: InviteDto;
  errorMessage?: string;
}

export interface UseInviteTokenDto {
  token: string;
  userId: string;
}

// Legacy types (keep for compatibility - gradually migrate to DTO types)
export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  preferences?: UserPreferences;
  academicInfo?: AcademicInfo;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: 'daily' | 'weekly' | 'never';
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

export interface AcademicInfo {
  institution?: string;
  grade?: string;
  major?: string;
  studentId?: string;
  graduationYear?: number;
}

// DTO types placeholder - 실제 application 패키지 연결 전까지 임시 정의
export interface ProfileDto {
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

export interface InviteDto {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  classId?: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdBy: string;
  usedBy?: string;
  createdAt: string;
  isExpired: boolean;
  isUsed: boolean;
  isValid: boolean;
}

// UI-specific state types
export interface AuthUIState {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface ProfileUIState {
  profile: ProfileDto | null;
  isLoading: boolean;
  error: string | null;
}

export interface InviteUIState {
  invites: InviteDto[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

// Feature flags for auth-related features
export interface AuthFeatureFlags {
  enableSelfRegistration: boolean;
  enableInviteSystem: boolean;
  enableRoleManagement: boolean;
  enablePasswordReset: boolean;
  enableProfileManagement: boolean;
  enableUserDirectory: boolean;
  enableRoleStatistics: boolean;
}

// Form state types
export interface SignInFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpFormState {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName: string;
  acceptTerms?: boolean;
  inviteToken?: string;
  role?: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number;
}

export interface CreateInviteFormState {
  email: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  expiryDays: number;
}

export interface UpdateProfileFormState {
  fullName: string;
  gradeLevel?: number;
  avatarUrl?: string;
  settings: {
    theme: 'light' | 'dark' | 'auto';
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
}

// Filter and search types
export interface UserListFilter {
  role?: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number;
  search?: string;
  page: number;
  limit: number;
}

export interface InviteListFilter {
  status?: 'pending' | 'used' | 'expired';
  role?: 'student' | 'teacher' | 'admin';
  search?: string;
  page: number;
  limit: number;
}

// Statistics and analytics types
export interface RoleStatistics {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
  activeInvites: number;
  expiredInvites: number;
}

// Legacy auth state types (keep for compatibility)
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  agreeToTerms: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Action result types for UI feedback
export interface AuthActionResult {
  success: boolean;
  message?: string;
  data?: any;
}