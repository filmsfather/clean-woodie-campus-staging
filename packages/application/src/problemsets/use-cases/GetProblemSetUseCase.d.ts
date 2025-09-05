import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IAssignmentRepository } from '@woodie/domain';
import { GetProblemSetRequest, GetProblemSetResponse } from '../dto/ProblemSetDto';
/**
 * 문제집 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사: 자신이 생성한 문제집 + 공유된(isShared=true) 문제집 조회 가능
 * - 학생: 과제로 배정받은 문제집만 조회 가능
 * - 관리자: 모든 문제집 조회 가능
 * - 권한에 따라 조회 가능한 상세 정보 제한
 */
export declare class GetProblemSetUseCase extends BaseUseCase<GetProblemSetRequest, GetProblemSetResponse> {
    private problemSetRepository;
    private assignmentRepository?;
    constructor(problemSetRepository: IProblemSetRepository, assignmentRepository?: IAssignmentRepository | undefined);
    execute(request: GetProblemSetRequest): Promise<Result<GetProblemSetResponse>>;
    private validateRequest;
    private checkPermissions;
    private checkStudentAssignment;
    private mapToDetailedDto;
    private mapItemsToDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
}
//# sourceMappingURL=GetProblemSetUseCase.d.ts.map