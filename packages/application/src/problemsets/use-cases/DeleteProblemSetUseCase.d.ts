import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IAssignmentRepository, IUserRepository } from '@woodie/domain';
import { DeleteProblemSetRequest, DeleteProblemSetResponse } from '../dto/ProblemSetDto';
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
export declare class DeleteProblemSetUseCase extends BaseUseCase<DeleteProblemSetRequest, DeleteProblemSetResponse> {
    private problemSetRepository;
    private userRepository;
    private assignmentRepository?;
    constructor(problemSetRepository: IProblemSetRepository, userRepository: IUserRepository, assignmentRepository?: IAssignmentRepository | undefined);
    execute(request: DeleteProblemSetRequest): Promise<Result<DeleteProblemSetResponse>>;
    private validateRequest;
    private checkOwnership;
    private checkDeletionSafety;
    private checkStudentProgress;
    private checkSharedUsage;
    private performCascadeDeletion;
}
//# sourceMappingURL=DeleteProblemSetUseCase.d.ts.map