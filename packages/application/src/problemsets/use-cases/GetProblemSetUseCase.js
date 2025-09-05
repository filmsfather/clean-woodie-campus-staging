import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID, StudentId } from '@woodie/domain';
/**
 * 문제집 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사: 자신이 생성한 문제집 + 공유된(isShared=true) 문제집 조회 가능
 * - 학생: 과제로 배정받은 문제집만 조회 가능
 * - 관리자: 모든 문제집 조회 가능
 * - 권한에 따라 조회 가능한 상세 정보 제한
 */
export class GetProblemSetUseCase extends BaseUseCase {
    problemSetRepository;
    assignmentRepository;
    constructor(problemSetRepository, assignmentRepository // 학생 권한 확인용
    ) {
        super();
        this.problemSetRepository = problemSetRepository;
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
            // 3. 권한 확인
            const permissionsResult = await this.checkPermissions(request, problemSet);
            if (permissionsResult.isFailure) {
                return Result.fail(permissionsResult.error);
            }
            const permissions = permissionsResult.value;
            if (!permissions.canRead) {
                return Result.fail('Access denied: You do not have permission to view this problem set');
            }
            // 4. 응답 DTO 생성 (권한에 따라 상세 정보 제한)
            const problemSetDto = await this.mapToDetailedDto(problemSet, request, permissions);
            const response = {
                problemSet: problemSetDto,
                permissions
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error retrieving problem set: ${error}`);
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
        if (!request.requesterRole || !['student', 'teacher', 'admin'].includes(request.requesterRole)) {
            errors.push('Valid requester role is required (student, teacher, admin)');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    async checkPermissions(request, problemSet) {
        const permissions = {
            problemSetId: request.problemSetId,
            userId: request.requesterId,
            userRole: request.requesterRole,
            canRead: false,
            canWrite: false,
            canDelete: false,
            canShare: false,
            canClone: false,
            isOwner: false
        };
        const isOwner = problemSet.isOwnedBy(request.requesterId);
        permissions.isOwner = isOwner;
        switch (request.requesterRole) {
            case 'admin':
                // 관리자는 모든 권한
                permissions.canRead = true;
                permissions.canWrite = true;
                permissions.canDelete = true;
                permissions.canShare = true;
                permissions.canClone = true;
                break;
            case 'teacher':
                if (isOwner) {
                    // 소유자는 모든 권한
                    permissions.canRead = true;
                    permissions.canWrite = true;
                    permissions.canDelete = true;
                    permissions.canShare = true;
                    permissions.canClone = true;
                }
                else {
                    // TODO: 공유된 문제집 확인 로직
                    // 현재는 기본적으로 읽기와 복제만 허용
                    permissions.canRead = true; // 공유된 문제집이라고 가정
                    permissions.canClone = true;
                }
                break;
            case 'student':
                // 학생은 과제로 배정받은 경우만 읽기 가능
                if (this.assignmentRepository) {
                    const hasAssignmentResult = await this.checkStudentAssignment(request.requesterId, request.problemSetId);
                    permissions.canRead = hasAssignmentResult.isSuccess && hasAssignmentResult.value;
                }
                break;
            default:
                return Result.fail('Invalid requester role');
        }
        return Result.ok(permissions);
    }
    async checkStudentAssignment(studentId, problemSetId) {
        if (!this.assignmentRepository) {
            return Result.fail('Assignment repository not available');
        }
        try {
            // 학생이 해당 문제집을 포함한 활성 과제를 가지고 있는지 확인
            const assignmentsResult = await this.assignmentRepository.findByProblemSetId(new UniqueEntityID(problemSetId));
            if (assignmentsResult.isFailure) {
                return Result.ok(false);
            }
            const assignments = assignmentsResult.value;
            const hasActiveAssignment = assignments.some(assignment => assignment.isActive() &&
                assignment.isAccessibleToStudents() &&
                assignment.isAssignedToStudent(StudentId.create(studentId).value));
            return Result.ok(hasActiveAssignment);
        }
        catch (error) {
            return Result.fail(`Failed to check student assignment: ${error}`);
        }
    }
    async mapToDetailedDto(problemSet, request, permissions) {
        const baseDto = {
            id: problemSet.id.toString(),
            title: problemSet.title.value,
            description: problemSet.description?.value,
            teacherId: problemSet.teacherId,
            itemCount: problemSet.itemCount,
            totalPoints: this.calculateTotalPoints(problemSet),
            estimatedTimeMinutes: this.calculateEstimatedTime(problemSet),
            isPublic: problemSet.isPublic,
            isShared: problemSet.isShared,
            createdAt: problemSet.createdAt,
            updatedAt: problemSet.updatedAt,
            items: []
        };
        // 아이템 정보 포함 (요청된 경우)
        if (request.includeItems && permissions.canRead) {
            baseDto.items = this.mapItemsToDto(problemSet.getOrderedItems());
        }
        // 학생인 경우 민감한 정보 제한
        if (request.requesterRole === 'student') {
            // 교사 정보 숨김
            baseDto.teacherId = 'hidden';
        }
        return baseDto;
    }
    mapItemsToDto(items) {
        return items.map(item => ({
            id: item.id.toString(),
            problemId: item.problemId.toString(),
            orderIndex: item.orderIndex,
            points: 10, // TODO: 실제 포인트 값
            settings: {} // TODO: 실제 설정 값
        }));
    }
    calculateTotalPoints(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.points || 10), 0);
    }
    calculateEstimatedTime(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.estimatedTimeMinutes || 3), 0);
    }
}
//# sourceMappingURL=GetProblemSetUseCase.js.map