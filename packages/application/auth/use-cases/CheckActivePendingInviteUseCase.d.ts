import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Result } from '@woodie/domain';
export interface CheckActivePendingInviteDto {
    email: string;
    organizationId: string;
}
export declare class CheckActivePendingInviteUseCase implements UseCase<CheckActivePendingInviteDto, boolean> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: CheckActivePendingInviteDto): Promise<Result<boolean>>;
}
//# sourceMappingURL=CheckActivePendingInviteUseCase.d.ts.map