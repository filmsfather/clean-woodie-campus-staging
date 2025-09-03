// 초대 생성 요청 DTO
export interface CreateInviteDto {
  email: string;
  role: 'student' | 'teacher' | 'admin';
  organizationId: string;
  classId?: string; // 학생 초대시만 필요
  createdBy: string; // 초대 생성자 ID
  expiryDays?: number; // 기본 7일
}

// 초대 응답 DTO
export interface InviteDto {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  classId?: string;
  token: string;
  expiresAt: string; // ISO 날짜 문자열
  usedAt?: string;
  createdBy: string;
  usedBy?: string;
  createdAt: string;
  isExpired: boolean;
  isUsed: boolean;
  isValid: boolean;
}

// 토큰 검증 요청 DTO
export interface ValidateInviteTokenDto {
  token: string;
}

// 토큰 검증 응답 DTO
export interface InviteTokenValidationDto {
  isValid: boolean;
  invite?: InviteDto;
  errorMessage?: string;
}

// 초대 사용 요청 DTO
export interface UseInviteTokenDto {
  token: string;
  userId: string; // 가입 완료한 사용자 ID
}