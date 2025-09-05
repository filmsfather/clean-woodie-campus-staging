import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';
export interface FindStudentsByGradeDto {
    gradeLevel: number;
    schoolId?: string;
}
export declare class FindStudentsByGradeUseCase implements UseCase<FindStudentsByGradeDto, Profile[]> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: FindStudentsByGradeDto): Promise<Result<Profile[]>>;
}
//# sourceMappingURL=FindStudentsByGradeUseCase.d.ts.map