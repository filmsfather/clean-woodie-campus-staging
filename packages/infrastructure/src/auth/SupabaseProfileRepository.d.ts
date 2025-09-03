import { IProfileRepository, ProfileFilters } from '@woodie/domain';
import { Profile, Email } from '@woodie/domain';
import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export declare class SupabaseProfileRepository implements IProfileRepository {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    save(profile: Profile): Promise<Result<Profile>>;
    findById(id: UniqueEntityID): Promise<Result<Profile | null>>;
    findByUserId(userId: string): Promise<Result<Profile | null>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByEmail(email: Email): Promise<Result<Profile | null>>;
    findBySchool(schoolId: string, filters?: ProfileFilters): Promise<Result<Profile[]>>;
    findByRole(role: 'student' | 'teacher' | 'admin'): Promise<Result<Profile[]>>;
    findStudentsByGrade(gradeLevel: number, schoolId?: string): Promise<Result<Profile[]>>;
    existsByEmail(email: Email): Promise<Result<boolean>>;
    existsByUserId(userId: string): Promise<Result<boolean>>;
    countByRole(schoolId?: string): Promise<Result<{
        students: number;
        teachers: number;
        admins: number;
    }>>;
    private toDomainEntity;
    private toDomainEntities;
}
//# sourceMappingURL=SupabaseProfileRepository.d.ts.map