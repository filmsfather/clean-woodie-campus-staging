import { Result } from '../../common/Result';
import { Invite } from '../entities/Invite';

// 도메인 레벨의 알림 서비스 인터페이스 - 순수 비즈니스 개념만
export interface INotificationService {
  // 초대가 생성되었음을 알림 (구체적인 방법은 구현체에서 결정)
  notifyInviteCreated(invite: Invite): Promise<Result<void>>;
  
  // 초대가 사용되었음을 알림
  notifyInviteUsed(invite: Invite): Promise<Result<void>>;
  
  // 초대가 만료되었음을 알림 (배치 작업용)
  notifyInviteExpired(invite: Invite): Promise<Result<void>>;
}