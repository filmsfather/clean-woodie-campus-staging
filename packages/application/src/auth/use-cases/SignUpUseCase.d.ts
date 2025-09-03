import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { UserRole, IUserRepository, IAuthRepository, AuthResult } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';
interface SignUpRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    classId?: string;
    context?: AuthContext;
}
export declare class SignUpUseCase implements UseCase<SignUpRequest, AuthResult> {
    private userRepository;
    private authRepository;
    constructor(userRepository: IUserRepository, authRepository: IAuthRepository);
    execute(request: SignUpRequest): Promise<Result<AuthResult>>;
}
export {};
//# sourceMappingURL=SignUpUseCase.d.ts.map