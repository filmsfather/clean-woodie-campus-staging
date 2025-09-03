import { ApplicationService } from '../../services/ApplicationService';
import { Result } from '@woodie/domain';
import { SignUpUseCase } from '../use-cases/SignUpUseCase';
import { SignInUseCase } from '../use-cases/SignInUseCase';
import { SignOutUseCase } from '../use-cases/SignOutUseCase';
import { RefreshTokenUseCase } from '../use-cases/RefreshTokenUseCase';
import { ResetPasswordUseCase } from '../use-cases/ResetPasswordUseCase';
import { AuthContext } from '../dto/AuthContext';
import { UserRole, AuthResult } from '@woodie/domain';
interface SignUpDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    classId?: string;
    context?: AuthContext;
}
interface SignInDto {
    email: string;
    password: string;
    context?: AuthContext;
}
interface SignOutDto {
    accessToken: string;
    context?: AuthContext;
}
interface RefreshTokenDto {
    refreshToken: string;
    context?: AuthContext;
}
interface ResetPasswordDto {
    email: string;
    context?: AuthContext;
}
export declare class AuthService implements ApplicationService {
    private signUpUseCase;
    private signInUseCase;
    private signOutUseCase;
    private refreshTokenUseCase;
    private resetPasswordUseCase;
    readonly name = "AuthService";
    constructor(signUpUseCase: SignUpUseCase, signInUseCase: SignInUseCase, signOutUseCase: SignOutUseCase, refreshTokenUseCase: RefreshTokenUseCase, resetPasswordUseCase: ResetPasswordUseCase);
    signUp(dto: SignUpDto): Promise<Result<AuthResult>>;
    signIn(dto: SignInDto): Promise<Result<AuthResult>>;
    signOut(dto: SignOutDto): Promise<Result<void>>;
    refreshToken(dto: RefreshTokenDto): Promise<Result<AuthResult>>;
    resetPassword(dto: ResetPasswordDto): Promise<Result<void>>;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map