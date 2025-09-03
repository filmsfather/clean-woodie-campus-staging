import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IInviteRepository } from '@woodie/domain';
import { ValidateInviteTokenDto, InviteTokenValidationDto } from '../dto/InviteDto';
export declare class ValidateInviteTokenUseCase implements UseCase<ValidateInviteTokenDto, InviteTokenValidationDto> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: ValidateInviteTokenDto): Promise<Result<InviteTokenValidationDto>>;
}
//# sourceMappingURL=ValidateInviteTokenUseCase.d.ts.map