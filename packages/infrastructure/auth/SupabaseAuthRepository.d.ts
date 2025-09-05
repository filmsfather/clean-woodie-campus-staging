import { IAuthRepository, AuthResult, Email, Password, Result } from '@woodie/domain';
export declare class SupabaseAuthRepository implements IAuthRepository {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    signUp(email: Email, password: Password): Promise<Result<AuthResult>>;
    signIn(email: Email, password: Password): Promise<Result<AuthResult>>;
    signOut(accessToken: string): Promise<Result<void>>;
    refreshToken(refreshToken: string): Promise<Result<AuthResult>>;
    resetPassword(email: Email): Promise<Result<void>>;
    private mapAuthError;
}
//# sourceMappingURL=SupabaseAuthRepository.d.ts.map