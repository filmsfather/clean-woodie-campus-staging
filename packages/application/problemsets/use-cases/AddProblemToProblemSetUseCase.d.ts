import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository, IProblemRepository, IUserRepository } from '@woodie/domain';
import { AddProblemToProblemSetRequest, AddProblemToProblemSetResponse } from '../dto/ProblemSetDto';
/**
 * 문제집에 문제 추가 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 문제 추가 가능
 * - 관리자는 모든 문제집에 문제 추가 가능
 * - 추가하려는 문제가 존재해야 함
 * - 이미 문제집에 포함된 문제는 중복 추가 불가
 * - 문제집당 최대 50개 문제 제한
 * - orderIndex 자동 할당 또는 수동 지정 가능
 */
export declare class AddProblemToProblemSetUseCase extends BaseUseCase<AddProblemToProblemSetRequest, AddProblemToProblemSetResponse> {
    private problemSetRepository;
    private problemRepository;
    private userRepository;
    constructor(problemSetRepository: IProblemSetRepository, problemRepository: IProblemRepository, userRepository: IUserRepository);
    execute(request: AddProblemToProblemSetRequest): Promise<Result<AddProblemToProblemSetResponse>>;
    private validateRequest;
    private checkOwnership;
    private findAddedItem;
    private mapToDetailedDto;
    private calculateTotalPoints;
    private calculateEstimatedTime;
    private validateProblemCompatibility;
    private enrichAddedItemWithProblemDetails;
}
//# sourceMappingURL=AddProblemToProblemSetUseCase.d.ts.map