import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 문제집 공개 설정 변경 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 공개 설정을 변경할 수 있음
 * - isPublic=true: 학생들이 조회 가능 (과제로 배정되거나 공개 문제집으로)
 * - 공개 문제집은 자동으로 공유(isShared=true)도 됨
 * - 공개 해제 시에도 기존 과제/복제본에는 영향 없음
 * - 빈 문제집(아이템 없음)은 공개할 수 없음
 */
export interface PublishProblemSetRequest {
    problemSetId: string;
    requesterId: string;
    isPublic: boolean;
    publishNote?: string;
}
export interface PublishProblemSetResponse {
    problemSetId: string;
    title: string;
    isPublic: boolean;
    isShared: boolean;
    publishedAt?: Date;
    unpublishedAt?: Date;
    message: string;
    warnings?: string[];
}
export declare class PublishProblemSetUseCase extends BaseUseCase<PublishProblemSetRequest, PublishProblemSetResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: PublishProblemSetRequest): Promise<Result<PublishProblemSetResponse>>;
    private validateRequest;
}
//# sourceMappingURL=PublishProblemSetUseCase.d.ts.map