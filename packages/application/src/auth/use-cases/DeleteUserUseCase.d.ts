import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, Result } from '@woodie/domain';
export interface DeleteUserDto {
    userId: string;
    requesterId?: string;
}
export declare class DeleteUserUseCase implements UseCase<DeleteUserDto, void> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(dto: DeleteUserDto): Promise<Result<void>>;
}
//# sourceMappingURL=DeleteUserUseCase.d.ts.map