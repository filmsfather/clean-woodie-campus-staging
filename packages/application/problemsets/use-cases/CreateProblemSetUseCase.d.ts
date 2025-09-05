import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
import { CreateProblemSetRequest, CreateProblemSetResponse } from '../dto/ProblemSetDto';
/**
 * 문제집 생성 UseCase
 *
 * 비즈니스 규칙:
 * - 교사만 문제집을 생성할 수 있음
 * - 제목은 필수이며 중복 불가 (같은 교사 내에서)
 * - isShared=true인 경우 모든 교사가 조회/복제 가능
 * - isPublic=true인 경우 학생도 조회 가능 (과제 배정 시)
 * - 초기 문제 추가 시 문제 존재 여부 확인
 */
export declare class CreateProblemSetUseCase extends BaseUseCase<CreateProblemSetRequest, CreateProblemSetResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: CreateProblemSetRequest): Promise<Result<CreateProblemSetResponse>>;
    private validateRequest;
    private mapToDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
}
//# sourceMappingURL=CreateProblemSetUseCase.d.ts.map