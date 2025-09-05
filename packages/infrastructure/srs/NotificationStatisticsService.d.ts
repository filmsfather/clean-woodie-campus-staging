import { UniqueEntityID, Result } from '@woodie/domain';
import { INotificationRepository } from './SupabaseNotificationRepository';
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
export interface INotificationStatisticsService {
    getStatistics(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationStatistics>>;
}
/**
 * 알림 통계 서비스
 * 알림 발송 성공률, 전달률, 평균 전달 시간 등의 통계를 계산
 */
export declare class NotificationStatisticsService implements INotificationStatisticsService {
    private notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    getStatistics(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationStatistics>>;
    /**
     * 특정 기간 내 학생의 알림 데이터 조회
     */
    private getNotificationsInPeriod;
    /**
     * 전체 시스템 통계 (관리자용)
     */
    getSystemStatistics(fromDate: Date, toDate: Date): Promise<Result<NotificationStatistics & {
        userCount: number;
        topFailureReasons: {
            reason: string;
            count: number;
        }[];
    }>>;
    private calculateSystemStats;
    /**
     * 실시간 통계 (최근 24시간)
     */
    getRealtimeStatistics(): Promise<Result<{
        last24Hours: NotificationStatistics;
        lastHour: NotificationStatistics;
        currentQueueSize: number;
    }>>;
}
/**
 * 테스트용 Mock Statistics Service
 */
export declare class MockNotificationStatisticsService implements INotificationStatisticsService {
    private mockData;
    constructor(mockData?: Partial<NotificationStatistics>);
    getStatistics(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationStatistics>>;
    setMockData(data: Partial<NotificationStatistics>): void;
}
//# sourceMappingURL=NotificationStatisticsService.d.ts.map