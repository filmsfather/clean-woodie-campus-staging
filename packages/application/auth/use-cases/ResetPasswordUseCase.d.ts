import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';
interface ResetPasswordRequest {
    email: string;
    context?: AuthContext;
}
export declare class ResetPasswordUseCase implements UseCase<ResetPasswordRequest, void> {
    private authRepository;
    constructor(authRepository: IAuthRepository);
    execute(request: ResetPasswordRequest): Promise<Result<void>>;
}
export {};
//# sourceMappingURL=ResetPasswordUseCase.d.ts.map