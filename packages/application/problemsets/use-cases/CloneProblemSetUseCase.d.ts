import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 문제집 복제 UseCase
 *
 * 비즈니스 규칙:
 * - 공유된 문제집(isShared=true)만 복제 가능
 * - 소유자는 자신의 문제집을 언제든 복제 가능
 * - 복제된 문제집은 새로운 소유자(복제 요청자)의 것이 됨
 * - 복제본은 기본적으로 비공개/비공유 상태로 생성
 * - 제목은 "Copy of [원본제목]" 형식 또는 사용자 지정
 * - 모든 문제 아이템과 설정이 복사됨
 */
export interface CloneProblemSetRequest {
    sourceProblemSetId: string;
    targetTeacherId: string;
    newTitle?: string;
    newDescription?: string;
    isPublic?: boolean;
    isShared?: boolean;
    preserveSettings?: boolean;
}
export interface CloneProblemSetResponse {
    clonedProblemSet: {
        id: string;
        title: string;
        description?: string;
        teacherId: string;
        itemCount: number;
        isPublic: boolean;
        isShared: boolean;
        createdAt: Date;
    };
    originalProblemSet: {
        id: string;
        title: string;
        teacherId: string;
        teacherName?: string;
    };
    cloneDetails: {
        itemsCopied: number;
        settingsCopied: boolean;
        totalPoints: number;
        estimatedTimeMinutes: number;
    };
}
export declare class CloneProblemSetUseCase extends BaseUseCase<CloneProblemSetRequest, CloneProblemSetResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: CloneProblemSetRequest): Promise<Result<CloneProblemSetResponse>>;
    private validateRequest;
    private canCloneProblemSet;
    private generateUniqueTitle;
    private calculateTotalPoints;
    private calculateEstimatedTime;
}
//# sourceMappingURL=CloneProblemSetUseCase.d.ts.map