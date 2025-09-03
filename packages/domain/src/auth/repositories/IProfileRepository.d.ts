import { Profile } from '../entities/Profile';
import { Email } from '../value-objects/Email';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProfileFilters {
    role?: 'student' | 'teacher' | 'admin';
    schoolId?: string;
    gradeLevel?: number;
    isActive?: boolean;
}
export interface IProfileRepository {
    save(profile: Profile): Promise<Result<Profile>>;
    findById(id: UniqueEntityID): Promise<Result<Profile | null>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByEmail(email: Email): Promise<Result<Profile | null>>;
    findByUserId(userId: string): Promise<Result<Profile | null>>;
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
}
//# sourceMappingURL=IProfileRepository.d.ts.map