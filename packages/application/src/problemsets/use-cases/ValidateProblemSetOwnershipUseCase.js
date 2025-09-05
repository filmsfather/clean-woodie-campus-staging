import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
export class ValidateProblemSetOwnershipUseCase extends BaseUseCase {
    problemSetRepository;
    constructor(problemSetRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 중복 제거 및 유효한 ID 필터링
            const uniqueProblemSetIds = [...new Set(request.problemSetIds.filter(id => id && id.trim()))];
            if (uniqueProblemSetIds.length === 0) {
                return Result.fail('No valid problem set IDs provided');
            }
            // 3. 일괄 소유권 검증 (최적화된 쿼리)
            const bulkOwnershipResult = await this.problemSetRepository.bulkVerifyOwnership(uniqueProblemSetIds.map(id => new UniqueEntityID(id)), request.requesterId);
            // 4. 각 문제집별 상세 권한 분석
            const validations = [];
            const errors = [];
            for (const problemSetId of uniqueProblemSetIds) {
                try {
                    const validation = await this.validateSingleProblemSet(problemSetId, request.requesterId, request.requesterRole, request.requiredPermission, bulkOwnershipResult);
                    validations.push(validation);
                }
                catch (error) {
                    errors.push(`Failed to validate ${problemSetId}: ${error}`);
                    // 실패한 경우에도 기본 검증 결과 추가
                    validations.push({
                        problemSetId,
                        problemSetTitle: 'Unknown',
                        isValid: false,
                        permissions: this.getDefaultPermissions(false),
                        ownershipDetails: {
                            isOwner: false,
                            ownerId: 'unknown',
                            isDelegatedManager: false
                        },
                        accessReason: 'Validation failed',
                        restrictions: ['Unable to verify ownership']
                    });
                }
            }
            // 5. 요약 정보 생성
            const summary = this.generateSummary(validations, request.requiredPermission);
            // 6. 응답 생성
            const response = {
                validations,
                summary,
                ...(errors.length > 0 && { errors })
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error validating ownership: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.problemSetIds || request.problemSetIds.length === 0) {
            errors.push('At least one problem set ID is required');
        }
        if (request.problemSetIds && request.problemSetIds.length > 50) {
            errors.push('Cannot validate more than 50 problem sets at once');
        }
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (!['student', 'teacher', 'admin'].includes(request.requesterRole)) {
            errors.push('Invalid requester role');
        }
        if (!['read', 'write', 'delete', 'share', 'statistics'].includes(request.requiredPermission)) {
            errors.push('Invalid required permission');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    async validateSingleProblemSet(problemSetId, requesterId, requesterRole, requiredPermission, bulkOwnershipResult) {
        // 1. 문제집 조회
        const problemSetResult = await this.problemSetRepository.findById(new UniqueEntityID(problemSetId));
        if (problemSetResult.isFailure) {
            return {
                problemSetId,
                problemSetTitle: 'Not Found',
                isValid: false,
                permissions: this.getDefaultPermissions(false),
                ownershipDetails: {
                    isOwner: false,
                    ownerId: 'unknown',
                    isDelegatedManager: false
                },
                accessReason: 'Problem set not found',
                restrictions: ['Problem set does not exist or has been deleted']
            };
        }
        const problemSet = problemSetResult.value;
        // 2. 기본 권한 확인
        const isOwner = problemSet.teacherId === requesterId;
        const isAdmin = requesterRole === 'admin';
        const isDelegatedManager = await this.checkDelegatedPermission(problemSetId, requesterId);
        // 3. 상세 권한 계산
        const permissions = this.calculateDetailedPermissions(problemSet, requesterId, requesterRole, isOwner, isAdmin, isDelegatedManager);
        // 4. 요청된 권한 검증
        const isValid = this.checkSpecificPermission(permissions, requiredPermission);
        // 5. 접근 이유 및 제한사항 분석
        const { accessReason, restrictions } = this.analyzeAccessDetails(problemSet, requesterId, requesterRole, permissions, isOwner, isAdmin, isDelegatedManager);
        return {
            problemSetId: problemSet.id.toString(),
            problemSetTitle: problemSet.title.value,
            isValid,
            permissions,
            ownershipDetails: {
                isOwner,
                ownerId: problemSet.teacherId,
                ownerName: 'Owner Name', // 실제로는 User 서비스에서 조회
                isDelegatedManager,
                delegatedBy: isDelegatedManager ? 'Delegator ID' : undefined
            },
            accessReason,
            restrictions
        };
    }
    calculateDetailedPermissions(problemSet, requesterId, requesterRole, isOwner, isAdmin, isDelegatedManager) {
        // 관리자는 모든 권한 보유
        if (isAdmin) {
            return {
                canRead: true,
                canWrite: true,
                canDelete: true,
                canShare: true,
                canViewStatistics: true,
                canClone: true
            };
        }
        // 소유자는 모든 권한 보유
        if (isOwner) {
            return {
                canRead: true,
                canWrite: true,
                canDelete: true,
                canShare: true,
                canViewStatistics: true,
                canClone: true
            };
        }
        // 위임된 관리자
        if (isDelegatedManager) {
            return {
                canRead: true,
                canWrite: true,
                canDelete: false, // 위임 관리자는 삭제 불가
                canShare: true,
                canViewStatistics: true,
                canClone: true
            };
        }
        // 교사의 경우 공유 설정에 따른 권한
        if (requesterRole === 'teacher') {
            return {
                canRead: problemSet.isShared,
                canWrite: false,
                canDelete: false,
                canShare: false,
                canViewStatistics: false,
                canClone: problemSet.isShared
            };
        }
        // 학생의 경우 공개 설정에 따른 권한
        if (requesterRole === 'student') {
            return {
                canRead: problemSet.isPublic,
                canWrite: false,
                canDelete: false,
                canShare: false,
                canViewStatistics: false,
                canClone: false
            };
        }
        return this.getDefaultPermissions(false);
    }
    checkSpecificPermission(permissions, requiredPermission) {
        switch (requiredPermission) {
            case 'read':
                return permissions.canRead;
            case 'write':
                return permissions.canWrite;
            case 'delete':
                return permissions.canDelete;
            case 'share':
                return permissions.canShare;
            case 'statistics':
                return permissions.canViewStatistics;
            default:
                return false;
        }
    }
    analyzeAccessDetails(problemSet, requesterId, requesterRole, permissions, isOwner, isAdmin, isDelegatedManager) {
        const restrictions = [];
        let accessReason;
        if (isAdmin) {
            accessReason = 'Administrator privileges';
        }
        else if (isOwner) {
            accessReason = 'Problem set owner';
        }
        else if (isDelegatedManager) {
            accessReason = 'Delegated manager';
            restrictions.push('Cannot delete problem set');
        }
        else if (requesterRole === 'teacher' && problemSet.isShared) {
            accessReason = 'Shared with teachers';
            restrictions.push('Read-only access', 'Cannot modify or delete');
        }
        else if (requesterRole === 'student' && problemSet.isPublic) {
            accessReason = 'Publicly available';
            restrictions.push('Read-only access', 'Cannot perform any modifications');
        }
        else {
            accessReason = 'No access permissions';
            restrictions.push('Private problem set', 'Contact owner for access');
        }
        return {
            accessReason,
            restrictions: restrictions.length > 0 ? restrictions : undefined
        };
    }
    async checkDelegatedPermission(problemSetId, requesterId) {
        // 실제로는 DelegatedPermission 테이블에서 조회
        // 현재는 false 반환
        return false;
    }
    getDefaultPermissions(hasAccess) {
        return {
            canRead: hasAccess,
            canWrite: false,
            canDelete: false,
            canShare: false,
            canViewStatistics: false,
            canClone: hasAccess
        };
    }
    generateSummary(validations, requiredPermission) {
        const totalRequested = validations.length;
        const totalValid = validations.filter(v => v.isValid).length;
        const totalInvalid = totalRequested - totalValid;
        return {
            totalRequested,
            totalValid,
            totalInvalid,
            hasFullAccess: totalInvalid === 0
        };
    }
}
//# sourceMappingURL=ValidateProblemSetOwnershipUseCase.js.map