import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IUserRepository } from '@woodie/domain';
import { RemoveProblemFromProblemSetRequest, RemoveProblemFromProblemSetResponse } from '../dto/ProblemSetDto';
/**
 * 문제집에서 문제 제거 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 문제 제거 가능
 * - 관리자는 모든 문제집에서 문제 제거 가능
 * - 문제집에 포함되지 않은 문제는 제거 불가
 * - 문제 제거 후 나머지 문제들의 순서 자동 재정렬
 * - 최소 1개 문제는 유지해야 함 (선택사항)
 */
export declare class RemoveProblemFromProblemSetUseCase extends BaseUseCase<RemoveProblemFromProblemSetRequest, RemoveProblemFromProblemSetResponse> {
    private problemSetRepository;
    private userRepository;
    constructor(problemSetRepository: IProblemSetRepository, userRepository: IUserRepository);
    execute(request: RemoveProblemFromProblemSetRequest): Promise<Result<RemoveProblemFromProblemSetResponse>>;
    private validateRequest;
    private checkOwnership;
    private checkPreRemovalConditions;
    private findItemToRemove;
    private mapToDetailedDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
    private checkActiveAssignmentUsage;
    private archiveRemovedItemData;
    private validateRemovalImpact;
}
//# sourceMappingURL=RemoveProblemFromProblemSetUseCase.d.ts.map