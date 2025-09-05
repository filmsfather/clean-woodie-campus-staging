import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IUserRepository } from '@woodie/domain';
import { ReorderProblemSetItemsRequest, ReorderProblemSetItemsResponse } from '../dto/ProblemSetDto';
/**
 * 문제집 문제 순서 재정렬 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 순서 재정렬 가능
 * - 관리자는 모든 문제집의 순서 재정렬 가능
 * - 모든 기존 문제가 새로운 순서에 포함되어야 함
 * - 순서는 0부터 시작하는 연속된 정수여야 함
 * - 드래그앤드롭 UI에서 사용하기 적합한 로직
 */
export declare class ReorderProblemSetItemsUseCase extends BaseUseCase<ReorderProblemSetItemsRequest, ReorderProblemSetItemsResponse> {
    private problemSetRepository;
    private userRepository;
    constructor(problemSetRepository: IProblemSetRepository, userRepository: IUserRepository);
    execute(request: ReorderProblemSetItemsRequest): Promise<Result<ReorderProblemSetItemsResponse>>;
    private validateRequest;
    private checkOwnership;
    private validateReorderRequest;
    private mapToDetailedDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
    private attemptRollback;
    private analyzeReorderImpact;
    private validatePedagogicalOrder;
    private notifyReorderToActiveAssignments;
    private generateReorderSummary;
}
//# sourceMappingURL=ReorderProblemSetItemsUseCase.d.ts.map