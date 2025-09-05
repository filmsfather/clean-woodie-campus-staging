import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository, AuthResult } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';
interface SignInRequest {
    email: string;
    password: string;
    context?: AuthContext;
}
export declare class SignInUseCase implements UseCase<SignInRequest, AuthResult> {
    private authRepository;
    constructor(authRepository: IAuthRepository);
    execute(request: SignInRequest): Promise<Result<AuthResult>>;
}
export {};
//# sourceMappingURL=SignInUseCase.d.ts.map