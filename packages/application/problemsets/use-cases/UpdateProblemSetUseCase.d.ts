import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IUserRepository } from '@woodie/domain';
import { UpdateProblemSetRequest, UpdateProblemSetResponse } from '../dto/ProblemSetDto';
/**
 * 문제집 수정 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 수정 가능
 * - 관리자는 모든 문제집 수정 가능
 * - 제목 변경 시 중복 확인 (같은 교사 내에서)
 * - 공유 설정 변경 시 기존 과제에 영향 없음
 */
export declare class UpdateProblemSetUseCase extends BaseUseCase<UpdateProblemSetRequest, UpdateProblemSetResponse> {
    private problemSetRepository;
    private userRepository;
    constructor(problemSetRepository: IProblemSetRepository, userRepository: IUserRepository);
    execute(request: UpdateProblemSetRequest): Promise<Result<UpdateProblemSetResponse>>;
    private validateRequest;
    private checkOwnership;
    private applyUpdates;
    private mapToDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
}
//# sourceMappingURL=UpdateProblemSetUseCase.d.ts.map