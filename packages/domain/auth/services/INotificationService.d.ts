import { Result } from '../../common/Result';
import { Invite } from '../entities/Invite';
export interface INotificationService {
    notifyInviteCreated(invite: Invite): Promise<Result<void>>;
    notifyInviteUsed(invite: Invite): Promise<Result<void>>;
    notifyInviteExpired(invite: Invite): Promise<Result<void>>;
}
//# sourceMappingURL=INotificationService.d.ts.map