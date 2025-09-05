import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 알림 발송 상태 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 알림 상태를 조회할 수 있음
 * - 예정된 알림과 발송된 알림을 구분하여 조회
 * - 알림 통계 및 전달률 분석 제공
 * - 알림 최적화를 위한 추천사항 제공
 */
export class GetNotificationStatusUseCase {
    notificationRepository;
    notificationStatisticsService;
    constructor(notificationRepository, notificationStatisticsService) {
        this.notificationRepository = notificationRepository;
        this.notificationStatisticsService = notificationStatisticsService;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            const studentId = new UniqueEntityID(request.studentId);
            const timeRangeDays = request.timeRangeInDays || 7;
            // 2. 조회 기간 설정
            const now = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - timeRangeDays);
            // 3. 예정된 알림 조회 (옵션)
            let scheduledNotifications;
            if (request.includeScheduled) {
                const scheduledResult = await this.notificationRepository.findScheduledByStudentId(studentId, { fromDate: now, limit: 100 });
                if (scheduledResult.isSuccess) {
                    scheduledNotifications = scheduledResult.getValue().map(this.mapToNotificationItem);
                }
            }
            // 4. 발송된 알림 조회 (옵션)
            let sentNotifications;
            if (request.includeSent) {
                const sentResult = await this.notificationRepository.findSentByStudentId(studentId, { fromDate, toDate: now, limit: 200 });
                if (sentResult.isSuccess) {
                    sentNotifications = sentResult.getValue().map(this.mapToNotificationItem);
                }
            }
            // 5. 통계 조회 (옵션)
            let statistics;
            if (request.includeStatistics) {
                const statsResult = await this.notificationStatisticsService.getStatistics(studentId, fromDate, now);
                if (statsResult.isSuccess) {
                    statistics = statsResult.getValue();
                }
            }
            // 6. 요약 정보 생성
            const summary = await this.generateSummary(studentId, scheduledNotifications);
            // 7. 추천사항 생성
            const recommendations = this.generateRecommendations(scheduledNotifications, sentNotifications, statistics);
            // 8. 응답 구성
            const response = {
                studentId: request.studentId,
                retrievedAt: now,
                timeRangeDays,
                scheduled: scheduledNotifications,
                sent: sentNotifications,
                statistics,
                summary,
                recommendations: recommendations.length > 0 ? recommendations : undefined
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get notification status: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        if (request.timeRangeInDays !== undefined && request.timeRangeInDays <= 0) {
            return Result.fail('Time range must be a positive number');
        }
        if (request.timeRangeInDays !== undefined && request.timeRangeInDays > 90) {
            return Result.fail('Time range cannot exceed 90 days');
        }
        return Result.ok();
    }
    /**
     * 도메인 객체를 DTO로 매핑
     */
    mapToNotificationItem(notification) {
        return {
            notificationId: notification.id.toString(),
            type: this.mapNotificationType(notification.type),
            scheduleId: notification.scheduleId?.toString(),
            problemId: notification.problemId?.toString(),
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            scheduledAt: notification.scheduledAt,
            sentAt: notification.sentAt,
            deliveryMethod: notification.deliveryMethod,
            status: notification.status,
            metadata: notification.metadata
        };
    }
    /**
     * 알림 타입 매핑
     */
    mapNotificationType(domainType) {
        if (domainType.isReview())
            return 'review_due';
        if (domainType.isOverdue())
            return 'overdue';
        if (domainType.isStreak())
            return 'streak';
        if (domainType.isAchievement())
            return 'achievement';
        return 'review_due'; // 기본값
    }
    /**
     * 요약 정보 생성
     */
    async generateSummary(studentId, scheduledNotifications) {
        // 대기 중인 알림 개수
        const pendingCount = scheduledNotifications?.filter(n => n.status === 'pending').length || 0;
        // 연체 알림 개수
        const overdueNotifications = scheduledNotifications?.filter(n => n.type === 'overdue').length || 0;
        // 다음 예정 알림
        const nextNotification = scheduledNotifications
            ?.filter(n => n.status === 'pending')
            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
        const nextScheduledNotification = nextNotification ? {
            scheduledAt: nextNotification.scheduledAt,
            type: nextNotification.type,
            priority: nextNotification.priority
        } : undefined;
        return {
            pendingCount,
            overdueNotifications,
            nextScheduledNotification
        };
    }
    /**
     * 추천사항 생성
     */
    generateRecommendations(scheduledNotifications, sentNotifications, statistics) {
        const recommendations = [];
        // 알림 발송 실패 문제
        if (statistics && statistics.deliveryRate < 0.8) {
            recommendations.push('알림 전달률이 낮습니다. 알림 설정이나 기기 설정을 확인해보세요.');
        }
        // 과도한 연체 알림
        if (scheduledNotifications) {
            const overdueCount = scheduledNotifications.filter(n => n.type === 'overdue').length;
            const totalScheduled = scheduledNotifications.length;
            if (totalScheduled > 0 && overdueCount / totalScheduled > 0.3) {
                recommendations.push('연체 알림이 많습니다. 복습 일정을 재검토하고 학습 계획을 조정해보세요.');
            }
        }
        // 알림이 너무 많은 경우
        if (scheduledNotifications && scheduledNotifications.length > 50) {
            recommendations.push('예정된 알림이 많습니다. 알림 빈도를 줄이거나 우선순위를 조정해보세요.');
        }
        // 알림이 너무 적은 경우
        if (scheduledNotifications && scheduledNotifications.length < 5) {
            recommendations.push('예정된 알림이 적습니다. 더 적극적인 학습 알림 설정을 고려해보세요.');
        }
        // 특정 타입의 알림만 사용하는 경우
        if (statistics && statistics.byType) {
            const { review_due, overdue, streak, achievement } = statistics.byType;
            const total = review_due + overdue + streak + achievement;
            if (total > 0 && achievement === 0) {
                recommendations.push('성취 알림을 활성화하면 동기부여에 도움이 됩니다.');
            }
            if (total > 0 && streak === 0) {
                recommendations.push('연속 학습 알림을 활성화하면 꾸준한 학습에 도움이 됩니다.');
            }
        }
        // 전달 방법 최적화
        if (statistics && statistics.byMethod) {
            const { push, email, in_app } = statistics.byMethod;
            const total = push + email + in_app;
            if (total > 0 && push === 0) {
                recommendations.push('푸시 알림을 활성화하면 더 즉시적인 알림을 받을 수 있습니다.');
            }
            if (total > 0 && email > push + in_app) {
                recommendations.push('이메일 알림보다 푸시나 앱 내 알림이 더 효과적일 수 있습니다.');
            }
        }
        // 높은 우선순위 알림이 많은 경우
        if (scheduledNotifications) {
            const highPriorityCount = scheduledNotifications.filter(n => n.priority === 'high' || n.priority === 'critical').length;
            if (highPriorityCount > scheduledNotifications.length * 0.5) {
                recommendations.push('높은 우선순위 알림이 많습니다. 학습 계획을 재조정해보세요.');
            }
        }
        return recommendations;
    }
}
//# sourceMappingURL=GetNotificationStatusUseCase.js.map