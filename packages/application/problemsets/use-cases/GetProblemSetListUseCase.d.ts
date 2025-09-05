import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
import { GetProblemSetListRequest, GetProblemSetListResponse } from '../dto/ProblemSetDto';
/**
 * 문제집 목록 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사: 자신이 생성한 문제집 + 공유된(isShared=true) 문제집 조회
 * - 학생: 과제로 배정받은 문제집만 조회 (별도 UseCase 필요할 수 있음)
 * - 관리자: 모든 문제집 조회 가능
 * - 필터링, 정렬, 페이지네이션 지원
 * - 공유 가능한 문제집들 우선 표시
 */
export declare class GetProblemSetListUseCase extends BaseUseCase<GetProblemSetListRequest, GetProblemSetListResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: GetProblemSetListRequest): Promise<Result<GetProblemSetListResponse>>;
    private validateRequest;
    private determineScopeByRole;
    private fetchProblemSets;
    private applyFilters;
    private applySorting;
    private calculatePagination;
    private mapToDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
}
//# sourceMappingURL=GetProblemSetListUseCase.d.ts.map