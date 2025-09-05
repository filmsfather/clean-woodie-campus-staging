import { ApplicationService } from '../../services/ApplicationService';
import { Result } from '@woodie/domain';
import { SignUpUseCase } from '../use-cases/SignUpUseCase';
import { SignInUseCase } from '../use-cases/SignInUseCase';
import { SignOutUseCase } from '../use-cases/SignOutUseCase';
import { RefreshTokenUseCase } from '../use-cases/RefreshTokenUseCase';
import { ResetPasswordUseCase } from '../use-cases/ResetPasswordUseCase';
import { DeleteUserUseCase } from '../use-cases/DeleteUserUseCase';
import { FindUserByEmailUseCase } from '../use-cases/FindUserByEmailUseCase';
import { FindUserByInviteTokenUseCase } from '../use-cases/FindUserByInviteTokenUseCase';
import { AuthContext } from '../dto/AuthContext';
import { UserRole, AuthResult, User } from '@woodie/domain';
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
interface DeleteUserDto {
    userId: string;
    requesterId?: string;
}
interface FindUserByEmailDto {
    email: string;
}
interface FindUserByInviteTokenDto {
    token: string;
}
export declare class AuthService implements ApplicationService {
    private signUpUseCase;
    private signInUseCase;
    private signOutUseCase;
    private refreshTokenUseCase;
    private resetPasswordUseCase;
    private deleteUserUseCase;
    private findUserByEmailUseCase;
    private findUserByInviteTokenUseCase;
    readonly name = "AuthService";
    constructor(signUpUseCase: SignUpUseCase, signInUseCase: SignInUseCase, signOutUseCase: SignOutUseCase, refreshTokenUseCase: RefreshTokenUseCase, resetPasswordUseCase: ResetPasswordUseCase, deleteUserUseCase: DeleteUserUseCase, findUserByEmailUseCase: FindUserByEmailUseCase, findUserByInviteTokenUseCase: FindUserByInviteTokenUseCase);
    signUp(dto: SignUpDto): Promise<Result<AuthResult>>;
    signIn(dto: SignInDto): Promise<Result<AuthResult>>;
    signOut(dto: SignOutDto): Promise<Result<void>>;
    refreshToken(dto: RefreshTokenDto): Promise<Result<AuthResult>>;
    resetPassword(dto: ResetPasswordDto): Promise<Result<void>>;
    deleteUser(dto: DeleteUserDto): Promise<Result<void>>;
    findUserByEmail(dto: FindUserByEmailDto): Promise<Result<User | null>>;
    findUserByInviteToken(dto: FindUserByInviteTokenDto): Promise<Result<User | null>>;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map