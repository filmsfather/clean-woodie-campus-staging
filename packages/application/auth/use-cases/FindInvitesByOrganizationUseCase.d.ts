import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, InviteFilters, Result } from '@woodie/domain';
export interface FindInvitesByOrganizationDto {
    organizationId: string;
    filters?: InviteFilters;
}
export declare class FindInvitesByOrganizationUseCase implements UseCase<FindInvitesByOrganizationDto, Invite[]> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: FindInvitesByOrganizationDto): Promise<Result<Invite[]>>;
}
//# sourceMappingURL=FindInvitesByOrganizationUseCase.d.ts.map