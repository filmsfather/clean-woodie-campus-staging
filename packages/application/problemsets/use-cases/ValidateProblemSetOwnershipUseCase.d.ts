import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 문제집 소유권 검증 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 수정/삭제 등의 작업 전 소유권 검증
 * - 관리자는 모든 문제집에 대한 관리 권한 보유
 * - 일괄 검증 지원 (여러 문제집 동시 검증)
 * - 권한 레벨별 상세 권한 정보 제공
 * - 위임된 권한(예: 공동 관리자) 지원
 */
export interface ValidateProblemSetOwnershipRequest {
    problemSetIds: string[];
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    requiredPermission: 'read' | 'write' | 'delete' | 'share' | 'statistics';
    skipCache?: boolean;
}
export interface ValidateProblemSetOwnershipResponse {
    validations: Array<{
        problemSetId: string;
        problemSetTitle: string;
        isValid: boolean;
        permissions: {
            canRead: boolean;
            canWrite: boolean;
            canDelete: boolean;
            canShare: boolean;
            canViewStatistics: boolean;
            canClone: boolean;
        };
        ownershipDetails: {
            isOwner: boolean;
            ownerId: string;
            ownerName?: string;
            isDelegatedManager?: boolean;
            delegatedBy?: string;
        };
        accessReason?: string;
        restrictions?: string[];
    }>;
    summary: {
        totalRequested: number;
        totalValid: number;
        totalInvalid: number;
        hasFullAccess: boolean;
    };
    errors?: string[];
}
export declare class ValidateProblemSetOwnershipUseCase extends BaseUseCase<ValidateProblemSetOwnershipRequest, ValidateProblemSetOwnershipResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: ValidateProblemSetOwnershipRequest): Promise<Result<ValidateProblemSetOwnershipResponse>>;
    private validateRequest;
    private validateSingleProblemSet;
    private calculateDetailedPermissions;
    private checkSpecificPermission;
    private analyzeAccessDetails;
    private checkDelegatedPermission;
    private getDefaultPermissions;
    private generateSummary;
}
//# sourceMappingURL=ValidateProblemSetOwnershipUseCase.d.ts.map