import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
/**
 * 문제집 삭제 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 삭제 가능
 * - 관리자는 모든 문제집 삭제 가능
 * - 활성 과제에서 사용 중인 문제집은 삭제 불가 (force=false인 경우)
 * - force=true인 경우 연관 과제와 함께 삭제 (매우 위험한 작업)
 * - 삭제 전 영향도 분석 및 경고 제공
 */
export class DeleteProblemSetUseCase extends BaseUseCase {
    problemSetRepository;
    userRepository;
    assignmentRepository;
    constructor(problemSetRepository, userRepository, assignmentRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 문제집 조회
            const problemSetResult = await this.problemSetRepository.findById(new UniqueEntityID(request.problemSetId));
            if (problemSetResult.isFailure) {
                return Result.fail('Problem set not found');
            }
            const problemSet = problemSetResult.value;
            // 3. 소유권 확인
            const ownershipResult = await this.checkOwnership(request, problemSet);
            if (ownershipResult.isFailure) {
                return Result.fail(ownershipResult.error);
            }
            // 4. 삭제 안전성 확인
            const safetyCheckResult = await this.checkDeletionSafety(request);
            if (safetyCheckResult.isFailure) {
                return Result.fail(safetyCheckResult.error);
            }
            const warnings = safetyCheckResult.value;
            // 5. 강제 삭제가 아닌 경우 활성 과제 확인
            if (!request.force && warnings.length > 0) {
                return Result.fail(`Cannot delete problem set: ${warnings.join('; ')}. Use force=true to override.`);
            }
            // 6. 문제집 삭제 실행
            const deleteResult = await this.problemSetRepository.delete(new UniqueEntityID(request.problemSetId));
            if (deleteResult.isFailure) {
                return Result.fail(`Failed to delete problem set: ${deleteResult.error}`);
            }
            // 7. 응답 생성
            const response = {
                success: true,
                ...(warnings.length > 0 && { warnings })
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error deleting problem set: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.problemSetId || request.problemSetId.trim().length === 0) {
            errors.push('Problem set ID is required');
        }
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (request.force !== undefined && typeof request.force !== 'boolean') {
            errors.push('Force flag must be a boolean');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    async checkOwnership(request, problemSet) {
        // 소유자 확인
        if (problemSet.isOwnedBy(request.requesterId)) {
            return Result.ok();
        }
        // 관리자 권한 확인
        const user = await this.userRepository.findById(new UniqueEntityID(request.requesterId));
        if (user && user.role === 'admin') {
            return Result.ok();
        }
        return Result.fail('Access denied: You can only delete your own problem sets');
    }
    async checkDeletionSafety(request) {
        const warnings = [];
        if (!this.assignmentRepository) {
            warnings.push('Cannot verify assignment dependencies - assignment repository not available');
            return Result.ok(warnings);
        }
        try {
            // 해당 문제집을 사용하는 과제들 조회
            const assignmentsResult = await this.assignmentRepository.findByProblemSetId(new UniqueEntityID(request.problemSetId));
            if (assignmentsResult.isSuccess) {
                const assignments = assignmentsResult.value;
                const activeAssignments = assignments.filter(assignment => assignment.isActive() && assignment.isAccessibleToStudents());
                const draftAssignments = assignments.filter(assignment => assignment.status === 'DRAFT');
                const closedAssignments = assignments.filter(assignment => assignment.status === 'CLOSED');
                if (activeAssignments.length > 0) {
                    warnings.push(`${activeAssignments.length} active assignment(s) are using this problem set`);
                }
                if (draftAssignments.length > 0) {
                    warnings.push(`${draftAssignments.length} draft assignment(s) are linked to this problem set`);
                }
                if (closedAssignments.length > 0) {
                    warnings.push(`${closedAssignments.length} closed assignment(s) have historical data linked to this problem set`);
                }
                // 총 과제 수가 많은 경우 경고
                if (assignments.length > 5) {
                    warnings.push(`This problem set is used in ${assignments.length} assignments - deletion will affect historical data`);
                }
            }
            return Result.ok(warnings);
        }
        catch (error) {
            warnings.push(`Error checking assignment dependencies: ${error}`);
            return Result.ok(warnings);
        }
    }
    // 추가적인 안전성 확인 메서드들
    async checkStudentProgress(problemSetId) {
        const warnings = [];
        // TODO: 학생 진도 데이터 확인
        // - 해당 문제집에 대한 학습 기록이 있는지 확인
        // - 진행 중인 학습이 있는지 확인
        // - 통계 데이터에 영향을 주는지 확인
        return Result.ok(warnings);
    }
    async checkSharedUsage(problemSetId) {
        const warnings = [];
        // TODO: 다른 교사들이 이 문제집을 복제했는지 확인
        // - 복제된 문제집들의 연관성 확인
        // - 공유 기록 확인
        return Result.ok(warnings);
    }
    async performCascadeDeletion(problemSetId, force) {
        if (!force) {
            return Result.ok();
        }
        try {
            // TODO: 강제 삭제 시 연관 데이터 정리
            // 1. 연관된 과제들을 비활성화하거나 삭제
            // 2. 학생 진도 데이터 아카이브
            // 3. 통계 데이터 재계산
            // 4. 캐시 무효화
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Failed to perform cascade deletion: ${error}`);
        }
    }
}
//# sourceMappingURL=DeleteProblemSetUseCase.js.map