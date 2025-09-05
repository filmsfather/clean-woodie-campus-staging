import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';
export interface FindProfilesBySchoolDto {
    schoolId: string;
    filters?: {
        role?: 'student' | 'teacher' | 'admin';
        gradeLevel?: number;
    };
}
export declare class FindProfilesBySchoolUseCase implements UseCase<FindProfilesBySchoolDto, Profile[]> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: FindProfilesBySchoolDto): Promise<Result<Profile[]>>;
}
//# sourceMappingURL=FindProfilesBySchoolUseCase.d.ts.map