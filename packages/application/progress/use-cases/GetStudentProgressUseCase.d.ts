import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService';
import { StudentProgressDto } from '../dto/ProgressDto';
export interface GetStudentProgressRequest {
    studentId: string;
    requesterId?: string;
    requesterRole?: 'student' | 'teacher' | 'admin';
}
export interface GetStudentProgressResponse {
    progress: StudentProgressDto;
}
/**
 * 학생 진도 현황 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 학생은 자신의 진도만 조회할 수 있음
 * - 교사는 담당 학급 학생들의 진도를 조회할 수 있음
 * - 관리자는 모든 학생의 진도를 조회할 수 있음
 */
export declare class GetStudentProgressUseCase extends BaseUseCase<GetStudentProgressRequest, GetStudentProgressResponse> {
    private progressService;
    constructor(progressService: ProgressTrackingApplicationService);
    execute(request: GetStudentProgressRequest): Promise<Result<GetStudentProgressResponse>>;
    private validateRequest;
    private checkAuthorization;
}
//# sourceMappingURL=GetStudentProgressUseCase.d.ts.map