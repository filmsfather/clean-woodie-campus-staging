import { UniqueEntityID, Result } from '@woodie/domain';
export interface GetNotificationStatusRequest {
    studentId: string;
    includeScheduled?: boolean;
    includeSent?: boolean;
    includeStatistics?: boolean;
    timeRangeInDays?: number;
}
export interface NotificationItem {
    notificationId: string;
    type: 'review_due' | 'overdue' | 'streak' | 'achievement';
    scheduleId?: string;
    problemId?: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    scheduledAt: Date;
    sentAt?: Date;
    deliveryMethod: 'push' | 'email' | 'in_app';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
    metadata?: any;
}
export interface NotificationStatistics {
    totalScheduled: number;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    averageDeliveryTime?: number;
    byType: {
        review_due: number;
        overdue: number;
        streak: number;
        achievement: number;
    };
    byMethod: {
        push: number;
        email: number;
        in_app: number;
    };
}
export interface GetNotificationStatusResponse {
    studentId: string;
    retrievedAt: Date;
    timeRangeDays: number;
    scheduled?: NotificationItem[];
    sent?: NotificationItem[];
    statistics?: NotificationStatistics;
    summary: {
        pendingCount: number;
        overdueNotifications: number;
        nextScheduledNotification?: {
            scheduledAt: Date;
            type: string;
            priority: string;
        };
    };
    recommendations?: string[];
}
/**
 * 알림 발송 상태 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 알림 상태를 조회할 수 있음
 * - 예정된 알림과 발송된 알림을 구분하여 조회
 * - 알림 통계 및 전달률 분석 제공
 * - 알림 최적화를 위한 추천사항 제공
 */
export declare class GetNotificationStatusUseCase {
    private notificationRepository;
    private notificationStatisticsService;
    constructor(notificationRepository: INotificationRepository, notificationStatisticsService: INotificationStatisticsService);
    execute(request: GetNotificationStatusRequest): Promise<Result<GetNotificationStatusResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 도메인 객체를 DTO로 매핑
     */
    private mapToNotificationItem;
    /**
     * 알림 타입 매핑
     */
    private mapNotificationType;
    /**
     * 요약 정보 생성
     */
    private generateSummary;
    /**
     * 추천사항 생성
     */
    private generateRecommendations;
}
interface INotificationRepository {
    findScheduledByStudentId(studentId: UniqueEntityID, options: {
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
    }): Promise<Result<any[]>>;
    findSentByStudentId(studentId: UniqueEntityID, options: {
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
    }): Promise<Result<any[]>>;
    save(notification: any): Promise<Result<void>>;
    delete(notificationId: UniqueEntityID): Promise<Result<void>>;
}
interface INotificationStatisticsService {
    getStatistics(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationStatistics>>;
}
export {};
//# sourceMappingURL=GetNotificationStatusUseCase.d.ts.map