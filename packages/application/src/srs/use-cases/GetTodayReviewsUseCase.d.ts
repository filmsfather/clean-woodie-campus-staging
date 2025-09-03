import { Result } from '@woodie/domain';
import { ReviewQueueService, ReviewQueueItem } from '../services/ReviewQueueService';
export interface GetTodayReviewsRequest {
    studentId: string;
}
export interface GetTodayReviewsResponse {
    reviews: ReviewQueueItem[];
    totalCount: number;
    highPriorityCount: number;
    overdueCount: number;
    upcomingCount: number;
}
/**
 * 오늘의 복습 항목 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 복습 항목을 조회할 수 있음
 * - 우선순위별로 정렬된 복습 항목 반환
 * - 연체된 항목이 최우선으로 표시됨
 * - 통계 정보도 함께 제공
 */
export declare class GetTodayReviewsUseCase {
    private reviewQueueService;
    constructor(reviewQueueService: ReviewQueueService);
    execute(request: GetTodayReviewsRequest): Promise<Result<GetTodayReviewsResponse>>;
}
//# sourceMappingURL=GetTodayReviewsUseCase.d.ts.map