import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';
export interface AuthResult {
    userId: string;
    accessToken?: string;
    refreshToken?: string;
    emailConfirmed: boolean;
    needsEmailConfirmation?: boolean;
}
export interface IAuthRepository {
    signUp(email: Email, password: Password): Promise<Result<AuthResult>>;
    signIn(email: Email, password: Password): Promise<Result<AuthResult>>;
    signOut(accessToken: string): Promise<Result<void>>;
    refreshToken(refreshToken: string): Promise<Result<AuthResult>>;
    resetPassword(email: Email): Promise<Result<void>>;
}
//# sourceMappingURL=IAuthRepository.d.ts.map