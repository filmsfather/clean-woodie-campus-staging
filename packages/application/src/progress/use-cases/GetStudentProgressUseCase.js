import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 학생 진도 현황 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 학생은 자신의 진도만 조회할 수 있음
 * - 교사는 담당 학급 학생들의 진도를 조회할 수 있음
 * - 관리자는 모든 학생의 진도를 조회할 수 있음
 */
export class GetStudentProgressUseCase extends BaseUseCase {
    progressService;
    constructor(progressService) {
        super();
        this.progressService = progressService;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 권한 확인
            const authResult = this.checkAuthorization(request);
            if (authResult.isFailure) {
                return Result.fail(authResult.error);
            }
            // 3. 학생 진도 조회
            const progressResult = await this.progressService.getStudentProgress(request.studentId);
            if (progressResult.isFailure) {
                return Result.fail(progressResult.error);
            }
            // 4. 응답 구성
            const response = {
                progress: progressResult.value
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get student progress: ${error}`);
        }
    }
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        return Result.ok();
    }
    checkAuthorization(request) {
        // 관리자는 모든 데이터에 접근 가능
        if (request.requesterRole === 'admin') {
            return Result.ok();
        }
        // 학생은 자신의 데이터만 접근 가능
        if (request.requesterRole === 'student' && request.requesterId === request.studentId) {
            return Result.ok();
        }
        // 교사는 담당 학급 학생 데이터에 접근 가능 (실제로는 더 복잡한 검증이 필요)
        if (request.requesterRole === 'teacher') {
            // TODO: 교사-학생 관계 확인 로직 구현
            return Result.ok();
        }
        return Result.fail('Access denied: Insufficient permissions to view this student\'s progress');
    }
}
//# sourceMappingURL=GetStudentProgressUseCase.js.map