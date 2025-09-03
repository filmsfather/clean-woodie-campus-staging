import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository, AuthResult } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';
interface RefreshTokenRequest {
    refreshToken: string;
    context?: AuthContext;
}
export declare class RefreshTokenUseCase implements UseCase<RefreshTokenRequest, AuthResult> {
    private authRepository;
    constructor(authRepository: IAuthRepository);
    execute(request: RefreshTokenRequest): Promise<Result<AuthResult>>;
}
export {};
//# sourceMappingURL=RefreshTokenUseCase.d.ts.map