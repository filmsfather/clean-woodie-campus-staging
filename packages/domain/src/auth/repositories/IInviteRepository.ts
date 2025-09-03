import { Invite } from '../entities/Invite';
import { InviteToken } from '../value-objects/InviteToken';
import { Email } from '../value-objects/Email';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

// 초대 검색 필터 인터페이스
export interface InviteFilters {
  organizationId?: string;
  createdBy?: string;
  role?: string;
  isUsed?: boolean;
  isExpired?: boolean;
}

// 초대 리포지토리 인터페이스
export interface IInviteRepository {
  // 기본 CRUD 작업
  save(invite: Invite): Promise<Result<Invite>>;
  findById(id: UniqueEntityID): Promise<Result<Invite | null>>;
  delete(id: UniqueEntityID): Promise<Result<void>>;
  
  // 초대 특화 조회 메서드
  findByToken(token: InviteToken): Promise<Result<Invite | null>>;
  findByEmail(email: Email): Promise<Result<Invite[]>>;
  findPendingInvitesByEmail(email: Email): Promise<Result<Invite[]>>; // 미사용 + 미만료
  
  // 관리자용 조회 메서드
  findByCreator(creatorId: string): Promise<Result<Invite[]>>;
  findByOrganization(organizationId: string, filters?: InviteFilters): Promise<Result<Invite[]>>;
  
  // 토큰 사용 처리
  markTokenAsUsed(token: InviteToken, userId: string): Promise<Result<Invite>>;
  
  // 만료된 토큰 정리 (배치 작업용)
  deleteExpiredTokens(olderThanDays?: number): Promise<Result<number>>;
  
  // 중복 초대 검증
  hasActivePendingInvite(email: Email, organizationId: string): Promise<Result<boolean>>;
}