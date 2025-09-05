import { UniqueEntityID, Result, IClock } from '@woodie/domain';
export interface ProcessNotificationQueueRequest {
    batchSize?: number;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    deliveryMethod?: 'push' | 'email' | 'in_app';
    maxProcessingTimeMs?: number;
}
export interface NotificationProcessingResult {
    notificationId: string;
    status: 'sent' | 'failed' | 'skipped';
    sentAt?: Date;
    failureReason?: string;
    deliveryMethod: 'push' | 'email' | 'in_app';
    processingTimeMs: number;
}
export interface ProcessNotificationQueueResponse {
    processedAt: Date;
    batchSize: number;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
    totalProcessingTimeMs: number;
    results: NotificationProcessingResult[];
    queueStatus: {
        remainingInQueue: number;
        nextBatchAvailable: boolean;
        estimatedProcessingTime: number;
    };
    errors?: string[];
}
/**
 * 알림 큐 처리 Use Case
 *
 * 비즈니스 규칙:
 * - 예정된 시간이 된 알림들을 배치 단위로 처리
 * - 우선순위에 따른 처리 순서 보장
 * - 조용한 시간대에는 긴급하지 않은 알림 지연
 * - 전달 실패 시 재시도 로직 포함
 * - 처리 시간 제한으로 시스템 안정성 보장
 */
export declare class ProcessNotificationQueueUseCase {
    private notificationRepository;
    private notificationSender;
    private notificationSettingsRepository;
    private clock;
    constructor(notificationRepository: INotificationRepository, notificationSender: INotificationSender, notificationSettingsRepository: INotificationSettingsRepository, clock: IClock);
    execute(request: ProcessNotificationQueueRequest): Promise<Result<ProcessNotificationQueueResponse>>;
    /**
     * 개별 알림 처리
     */
    private processSingleNotification;
    /**
     * 조용한 시간 확인
     */
    private isQuietHours;
    /**
     * 긴급 알림 여부 확인
     */
    private isCriticalNotification;
    /**
     * 알림 타입 활성화 여부 확인
     */
    private isNotificationTypeEnabled;
    /**
     * 다음 가능한 발송 시간 계산
     */
    private calculateNextAvailableTime;
    /**
     * 큐 상태 조회
     */
    private getQueueStatus;
    private parseTimeToMinutes;
    private rescheduleNotification;
    private markNotificationAsCancelled;
    private markNotificationAsSent;
    private handleSendFailure;
}
interface INotificationSender {
    send(request: {
        notificationId: UniqueEntityID;
        studentId: UniqueEntityID;
        type: string;
        title: string;
        message: string;
        deliveryMethod: 'push' | 'email' | 'in_app';
        priority: 'low' | 'medium' | 'high' | 'critical';
        metadata?: any;
    }): Promise<Result<void>>;
}
interface INotificationRepository {
    findPendingNotifications(options: {
        limit?: number;
        priority?: string;
        deliveryMethod?: string;
        scheduledBefore?: Date;
    }): Promise<Result<any[]>>;
    countPendingNotifications(options: {
        scheduledBefore?: Date;
    }): Promise<Result<number>>;
    save(notification: any): Promise<Result<void>>;
}
interface INotificationSettingsRepository {
    findByStudentId(studentId: UniqueEntityID): Promise<Result<any | null>>;
}
export {};
//# sourceMappingURL=ProcessNotificationQueueUseCase.d.ts.map