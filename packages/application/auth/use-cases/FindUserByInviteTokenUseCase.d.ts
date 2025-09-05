import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, User, Result } from '@woodie/domain';
export interface FindUserByInviteTokenDto {
    token: string;
}
export declare class FindUserByInviteTokenUseCase implements UseCase<FindUserByInviteTokenDto, User | null> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(dto: FindUserByInviteTokenDto): Promise<Result<User | null>>;
}
//# sourceMappingURL=FindUserByInviteTokenUseCase.d.ts.map