import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 알림 통계 서비스
 * 알림 발송 성공률, 전달률, 평균 전달 시간 등의 통계를 계산
 */
export class NotificationStatisticsService {
    notificationRepository;
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async getStatistics(studentId, fromDate, toDate) {
        try {
            // 기간 내 해당 학생의 모든 알림 데이터 조회
            const notificationsResult = await this.getNotificationsInPeriod(studentId, fromDate, toDate);
            if (notificationsResult.isFailure) {
                return Result.fail(`Failed to get notifications: ${notificationsResult.error}`);
            }
            const notifications = notificationsResult.getValue();
            // 기본 통계 계산
            const totalScheduled = notifications.length;
            const totalSent = notifications.filter(n => n.status === 'sent').length;
            const totalDelivered = notifications.filter(n => n.status === 'sent' && n.sent_at).length; // sent_at이 있으면 전달된 것으로 가정
            const totalFailed = notifications.filter(n => n.status === 'failed').length;
            // 전달률 계산 (scheduled 대비 sent 비율)
            const deliveryRate = totalScheduled > 0 ? (totalSent / totalScheduled) * 100 : 0;
            // 평균 전달 시간 계산
            const deliveryTimes = notifications
                .filter(n => n.processing_time_ms !== null && n.status === 'sent')
                .map(n => n.processing_time_ms || 0);
            const averageDeliveryTime = deliveryTimes.length > 0
                ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
                : undefined;
            // 타입별 통계 계산
            const byType = {
                review_due: notifications.filter(n => n.type === 'review_due').length,
                overdue: notifications.filter(n => n.type === 'overdue').length,
                streak: notifications.filter(n => n.type === 'streak').length,
                achievement: notifications.filter(n => n.type === 'achievement').length
            };
            // 전달 방법별 통계 계산
            const byMethod = {
                push: notifications.filter(n => n.delivery_method === 'push').length,
                email: notifications.filter(n => n.delivery_method === 'email').length,
                in_app: notifications.filter(n => n.delivery_method === 'in_app').length
            };
            const statistics = {
                totalScheduled,
                totalSent,
                totalDelivered,
                totalFailed,
                deliveryRate: Math.round(deliveryRate * 100) / 100, // 소수점 2자리까지
                averageDeliveryTime,
                byType,
                byMethod
            };
            return Result.ok(statistics);
        }
        catch (error) {
            return Result.fail(`Failed to calculate notification statistics: ${error}`);
        }
    }
    /**
     * 특정 기간 내 학생의 알림 데이터 조회
     */
    async getNotificationsInPeriod(studentId, fromDate, toDate) {
        try {
            // Repository에서 기간별 알림 조회
            // 실제 구현에서는 Repository에 이 메서드를 추가해야 함
            return await this.notificationRepository.findByStudentAndPeriod(studentId, fromDate, toDate);
        }
        catch (error) {
            return Result.fail(`Failed to get notifications for period: ${error}`);
        }
    }
    /**
     * 전체 시스템 통계 (관리자용)
     */
    async getSystemStatistics(fromDate, toDate) {
        try {
            // 시스템 전체 통계 계산
            const systemStats = await this.calculateSystemStats(fromDate, toDate);
            return Result.ok(systemStats);
        }
        catch (error) {
            return Result.fail(`Failed to calculate system statistics: ${error}`);
        }
    }
    async calculateSystemStats(fromDate, toDate) {
        // 시스템 전체 통계 계산 로직
        // 실제 구현에서는 더 복잡한 쿼리가 필요
        return {
            totalScheduled: 0,
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            deliveryRate: 0,
            byType: { review_due: 0, overdue: 0, streak: 0, achievement: 0 },
            byMethod: { push: 0, email: 0, in_app: 0 },
            userCount: 0,
            topFailureReasons: []
        };
    }
    /**
     * 실시간 통계 (최근 24시간)
     */
    async getRealtimeStatistics() {
        try {
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
            // 임시 학생 ID (실제로는 전체 통계를 위한 다른 방법 필요)
            const tempStudentId = new UniqueEntityID('system');
            const stats24h = await this.getStatistics(tempStudentId, last24Hours, now);
            const stats1h = await this.getStatistics(tempStudentId, lastHour, now);
            if (stats24h.isFailure || stats1h.isFailure) {
                return Result.fail('Failed to get realtime statistics');
            }
            // 현재 큐 크기 조회
            const queueResult = await this.notificationRepository.countPendingNotifications({
                scheduledBefore: now
            });
            const currentQueueSize = queueResult.isSuccess ? queueResult.getValue() : 0;
            return Result.ok({
                last24Hours: stats24h.getValue(),
                lastHour: stats1h.getValue(),
                currentQueueSize
            });
        }
        catch (error) {
            return Result.fail(`Failed to get realtime statistics: ${error}`);
        }
    }
}
/**
 * 테스트용 Mock Statistics Service
 */
export class MockNotificationStatisticsService {
    mockData;
    constructor(mockData) {
        this.mockData = {
            totalScheduled: 100,
            totalSent: 95,
            totalDelivered: 90,
            totalFailed: 5,
            deliveryRate: 95.0,
            averageDeliveryTime: 250,
            byType: {
                review_due: 70,
                overdue: 20,
                streak: 5,
                achievement: 5
            },
            byMethod: {
                push: 60,
                email: 25,
                in_app: 15
            },
            ...mockData
        };
    }
    async getStatistics(studentId, fromDate, toDate) {
        await new Promise(resolve => setTimeout(resolve, 10)); // 짧은 지연
        return Result.ok(this.mockData);
    }
    setMockData(data) {
        this.mockData = { ...this.mockData, ...data };
    }
}
//# sourceMappingURL=NotificationStatisticsService.js.map