import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 문제집 공유 설정 변경 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 공유 설정을 변경할 수 있음
 * - isShared=true: 다른 교사들이 조회/복제 가능
 * - isPublic=true: 학생들도 조회 가능 (과제로 배정 시)
 * - 공유 해제 시 기존 복제본에는 영향 없음
 */
export interface ShareProblemSetRequest {
    problemSetId: string;
    requesterId: string;
    isShared: boolean;
    isPublic?: boolean;
}
export interface ShareProblemSetResponse {
    problemSetId: string;
    title: string;
    isShared: boolean;
    isPublic: boolean;
    sharedAt?: Date;
    message: string;
}
export declare class ShareProblemSetUseCase extends BaseUseCase<ShareProblemSetRequest, ShareProblemSetResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: ShareProblemSetRequest): Promise<Result<ShareProblemSetResponse>>;
    private validateRequest;
}
//# sourceMappingURL=ShareProblemSetUseCase.d.ts.map