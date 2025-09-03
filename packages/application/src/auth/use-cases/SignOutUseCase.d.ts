import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';
interface SignOutRequest {
    accessToken: string;
    context?: AuthContext;
}
export declare class SignOutUseCase implements UseCase<SignOutRequest, void> {
    private authRepository;
    constructor(authRepository: IAuthRepository);
    execute(request: SignOutRequest): Promise<Result<void>>;
}
export {};
//# sourceMappingURL=SignOutUseCase.d.ts.map