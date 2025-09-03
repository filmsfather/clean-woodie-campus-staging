import { IInviteRepository, InviteFilters, Invite, InviteToken, Email, Result, UniqueEntityID } from '@woodie/domain';
export declare class SupabaseInviteRepository implements IInviteRepository {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
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
    private toDomainEntity;
    private toDomainEntities;
}
//# sourceMappingURL=SupabaseInviteRepository.d.ts.map