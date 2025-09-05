import { IUserRepository, User, Email, Result, UniqueEntityID } from '@woodie/domain';
export declare class SupabaseUserRepository implements IUserRepository {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    save(user: User): Promise<Result<User>>;
    findById(id: UniqueEntityID): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByInviteToken(token: string): Promise<User | null>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    private mapRowToUser;
}
//# sourceMappingURL=SupabaseUserRepository.d.ts.map