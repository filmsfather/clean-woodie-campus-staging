import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, User, Result } from '@woodie/domain';
export interface FindUserByEmailDto {
    email: string;
}
export declare class FindUserByEmailUseCase implements UseCase<FindUserByEmailDto, User | null> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(dto: FindUserByEmailDto): Promise<Result<User | null>>;
}
//# sourceMappingURL=FindUserByEmailUseCase.d.ts.map