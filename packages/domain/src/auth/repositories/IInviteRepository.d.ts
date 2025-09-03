import { Invite } from '../entities/Invite';
import { InviteToken } from '../value-objects/InviteToken';
import { Email } from '../value-objects/Email';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export interface InviteFilters {
    organizationId?: string;
    createdBy?: string;
    role?: string;
    isUsed?: boolean;
    isExpired?: boolean;
}
export interface IInviteRepository {
    save(invite: Invite): Promise<Result<Invite>>;
    findById(id: UniqueEntityID): Promise<Result<Invite | null>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByToken(token: InviteToken): Promise<Result<Invite | null>>;
    findByEmail(email: Email): Promise<Result<Invite[]>>;
    findPendingInvitesByEmail(email: Email): Promise<Result<Invite[]>>;
    findByCreator(creatorId: string): Promise<Result<Invite[]>>;
    findByOrganization(organizationId: string, filters?: InviteFilters): Promise<Result<Invite[]>>;
    markTokenAsUsed(token: InviteToken, userId: string): Promise<Result<Invite>>;
    deleteExpiredTokens(olderThanDays?: number): Promise<Result<number>>;
    hasActivePendingInvite(email: Email, organizationId: string): Promise<Result<boolean>>;
}
//# sourceMappingURL=IInviteRepository.d.ts.map