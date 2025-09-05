import { Result, ISpacedRepetitionPolicy, IClock } from '@woodie/domain';
export interface CreateReviewScheduleRequest {
    studentId: string;
    problemId: string;
}
export interface CreateReviewScheduleResponse {
    scheduleId: string;
    studentId: string;
    problemId: string;
    nextReviewAt: Date;
    initialInterval: number;
    initialEaseFactor: number;
    createdAt: Date;
}
/**
 * 복습 스케줄 생성 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 복습 일정을 생성할 수 있음
 * - 하나의 학생-문제 조합당 하나의 활성 스케줄만 존재
 * - 초기 복습 간격은 정책에 따라 자동 설정
 * - 스케줄 생성 시 관련 이벤트가 발행됨
 */
export declare class CreateReviewScheduleUseCase {
    private policy;
    private clock;
    constructor(policy: ISpacedRepetitionPolicy, clock: IClock);
    execute(request: CreateReviewScheduleRequest): Promise<Result<CreateReviewScheduleResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
}
//# sourceMappingURL=CreateReviewScheduleUseCase.d.ts.map