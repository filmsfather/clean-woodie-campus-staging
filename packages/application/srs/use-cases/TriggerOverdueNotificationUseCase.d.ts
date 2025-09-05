import { Result, IClock } from '@woodie/domain';
import { IReviewScheduleRepository } from '@woodie/domain';
export interface TriggerOverdueNotificationRequest {
    scheduleId?: string;
    studentId?: string;
    batchSize?: number;
}
export interface OverdueNotificationResult {
    scheduleId: string;
    studentId: string;
    problemId: string;
    overdueHours: number;
    notificationTriggered: boolean;
}
export interface TriggerOverdueNotificationResponse {
    processedSchedules: OverdueNotificationResult[];
    totalProcessed: number;
    notificationsTriggered: number;
    batchCompleted: boolean;
}
/**
 * 연체 복습 알림 트리거 Use Case
 *
 * 비즈니스 규칙:
 * - 연체된 복습 일정에 대해서만 알림을 발송함
 * - 특정 스케줄 또는 학생의 모든 연체 항목 처리 가능
 * - 배치 처리로 대량의 연체 항목 처리 지원
 * - 이미 알림이 발송된 항목은 중복 발송하지 않음
 */
export declare class TriggerOverdueNotificationUseCase {
    private reviewScheduleRepository;
    private clock;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, clock: IClock);
    execute(request: TriggerOverdueNotificationRequest): Promise<Result<TriggerOverdueNotificationResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
}
//# sourceMappingURL=TriggerOverdueNotificationUseCase.d.ts.map