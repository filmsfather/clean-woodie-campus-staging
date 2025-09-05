import { Result } from '@woodie/domain';
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
export class ProcessNotificationQueueUseCase {
    notificationRepository;
    notificationSender;
    notificationSettingsRepository;
    clock;
    constructor(notificationRepository, notificationSender, notificationSettingsRepository, clock) {
        this.notificationRepository = notificationRepository;
        this.notificationSender = notificationSender;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.clock = clock;
    }
    async execute(request) {
        const startTime = this.clock.now().getTime();
        const maxProcessingTime = request.maxProcessingTimeMs || 30000;
        const batchSize = request.batchSize || 100;
        try {
            // 1. 처리할 알림들 조회
            const pendingNotificationsResult = await this.notificationRepository.findPendingNotifications({
                limit: batchSize,
                priority: request.priority,
                deliveryMethod: request.deliveryMethod,
                scheduledBefore: this.clock.now()
            });
            if (pendingNotificationsResult.isFailure) {
                return Result.fail(pendingNotificationsResult.error);
            }
            const pendingNotifications = pendingNotificationsResult.getValue();
            const results = [];
            const errors = [];
            let processedCount = 0;
            let successCount = 0;
            let failureCount = 0;
            let skippedCount = 0;
            // 2. 각 알림 처리
            for (const notification of pendingNotifications) {
                // 처리 시간 제한 확인
                const currentTime = this.clock.now().getTime();
                if (currentTime - startTime > maxProcessingTime) {
                    errors.push(`Processing time limit exceeded. ${pendingNotifications.length - processedCount} notifications remain.`);
                    break;
                }
                const processingStart = currentTime;
                try {
                    // 3. 개별 알림 처리
                    const processResult = await this.processSingleNotification(notification);
                    const processingTime = this.clock.now().getTime() - processingStart;
                    results.push({
                        notificationId: notification.id.toString(),
                        status: processResult.status,
                        sentAt: processResult.sentAt,
                        failureReason: processResult.failureReason,
                        deliveryMethod: notification.deliveryMethod,
                        processingTimeMs: processingTime
                    });
                    // 통계 업데이트
                    if (processResult.status === 'sent') {
                        successCount++;
                    }
                    else if (processResult.status === 'failed') {
                        failureCount++;
                    }
                    else {
                        skippedCount++;
                    }
                    processedCount++;
                }
                catch (error) {
                    const processingTime = this.clock.now().getTime() - processingStart;
                    results.push({
                        notificationId: notification.id.toString(),
                        status: 'failed',
                        failureReason: `Processing error: ${error}`,
                        deliveryMethod: notification.deliveryMethod,
                        processingTimeMs: processingTime
                    });
                    failureCount++;
                    processedCount++;
                    errors.push(`Failed to process notification ${notification.id}: ${error}`);
                }
            }
            // 4. 큐 상태 조회
            const queueStatus = await this.getQueueStatus(batchSize);
            // 5. 응답 구성
            const totalProcessingTime = this.clock.now().getTime() - startTime;
            const response = {
                processedAt: this.clock.now(),
                batchSize,
                totalProcessed: processedCount,
                successCount,
                failureCount,
                skippedCount,
                totalProcessingTimeMs: totalProcessingTime,
                results,
                queueStatus,
                errors: errors.length > 0 ? errors : undefined
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to process notification queue: ${error}`);
        }
    }
    /**
     * 개별 알림 처리
     */
    async processSingleNotification(notification) {
        try {
            // 1. 사용자의 알림 설정 확인
            const settingsResult = await this.notificationSettingsRepository.findByStudentId(notification.studentId);
            if (settingsResult.isSuccess && settingsResult.getValue()) {
                const settings = settingsResult.getValue();
                // 2. 조용한 시간 체크
                if (this.isQuietHours(settings, this.clock.now()) && !this.isCriticalNotification(notification)) {
                    // 조용한 시간이므로 다음 가능한 시간으로 재스케줄
                    const nextAvailableTime = this.calculateNextAvailableTime(settings, this.clock.now());
                    await this.rescheduleNotification(notification, nextAvailableTime);
                    return {
                        status: 'skipped',
                        failureReason: 'Rescheduled due to quiet hours'
                    };
                }
                // 3. 알림 타입별 활성화 여부 확인
                if (!this.isNotificationTypeEnabled(settings, notification.type)) {
                    await this.markNotificationAsCancelled(notification);
                    return {
                        status: 'skipped',
                        failureReason: 'Notification type disabled in user settings'
                    };
                }
            }
            // 4. 알림 발송
            const sendResult = await this.notificationSender.send({
                notificationId: notification.id,
                studentId: notification.studentId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                deliveryMethod: notification.deliveryMethod,
                priority: notification.priority,
                metadata: notification.metadata
            });
            if (sendResult.isSuccess) {
                const sentAt = this.clock.now();
                // 5. 알림 상태 업데이트
                await this.markNotificationAsSent(notification, sentAt);
                return {
                    status: 'sent',
                    sentAt
                };
            }
            else {
                // 6. 발송 실패 처리
                await this.handleSendFailure(notification, sendResult.error);
                return {
                    status: 'failed',
                    failureReason: sendResult.error
                };
            }
        }
        catch (error) {
            await this.handleSendFailure(notification, String(error));
            return {
                status: 'failed',
                failureReason: String(error)
            };
        }
    }
    /**
     * 조용한 시간 확인
     */
    isQuietHours(settings, currentTime) {
        if (!settings.quietHoursStart || !settings.quietHoursEnd) {
            return false;
        }
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const currentMinutes = currentHour * 60 + currentMinute;
        const startMinutes = this.parseTimeToMinutes(settings.quietHoursStart);
        const endMinutes = this.parseTimeToMinutes(settings.quietHoursEnd);
        if (startMinutes === null || endMinutes === null) {
            return false;
        }
        // 같은 날인 경우
        if (startMinutes < endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
        // 다음 날로 넘어가는 경우
        else {
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
    }
    /**
     * 긴급 알림 여부 확인
     */
    isCriticalNotification(notification) {
        return notification.priority === 'critical';
    }
    /**
     * 알림 타입 활성화 여부 확인
     */
    isNotificationTypeEnabled(settings, notificationType) {
        switch (notificationType) {
            case 'review_due':
                return settings.enableReviewReminders;
            case 'overdue':
                return settings.enableOverdueAlerts;
            case 'streak':
                return settings.enableStreakNotifications;
            case 'achievement':
                return settings.enableAchievementNotifications;
            default:
                return true; // 알 수 없는 타입은 기본적으로 허용
        }
    }
    /**
     * 다음 가능한 발송 시간 계산
     */
    calculateNextAvailableTime(settings, currentTime) {
        if (!settings.quietHoursEnd) {
            // 조용한 시간 종료 시간이 없으면 1시간 후로 설정
            return new Date(currentTime.getTime() + 60 * 60 * 1000);
        }
        const tomorrow = new Date(currentTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 조용한 시간이 다음 날로 넘어가는 경우 처리
        const quietStart = settings.quietHoursStart;
        const quietEnd = settings.quietHoursEnd;
        if (!quietStart || !quietEnd)
            return tomorrow;
        const [endHours, endMinutes] = quietEnd.split(':').map(Number);
        if (this.parseTimeToMinutes(quietStart) !== null && this.parseTimeToMinutes(quietEnd) !== null &&
            this.parseTimeToMinutes(quietStart) > this.parseTimeToMinutes(quietEnd)) {
            const endTime = new Date(currentTime);
            endTime.setHours(endHours, endMinutes, 0, 0);
            if (endTime > currentTime) {
                return endTime;
            }
        }
        // 다음 날 조용한 시간 종료 시간
        tomorrow.setHours(endHours, endMinutes, 0, 0);
        return tomorrow;
    }
    /**
     * 큐 상태 조회
     */
    async getQueueStatus(batchSize) {
        try {
            const remainingCountResult = await this.notificationRepository.countPendingNotifications({
                scheduledBefore: this.clock.now()
            });
            const remainingInQueue = remainingCountResult.isSuccess ? remainingCountResult.getValue() : 0;
            const nextBatchAvailable = remainingInQueue > 0;
            const estimatedProcessingTime = Math.ceil(remainingInQueue / batchSize) * 30; // 배치당 30초 추정
            return {
                remainingInQueue,
                nextBatchAvailable,
                estimatedProcessingTime
            };
        }
        catch (error) {
            return {
                remainingInQueue: 0,
                nextBatchAvailable: false,
                estimatedProcessingTime: 0
            };
        }
    }
    // Helper 메서드들
    parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes))
            return null;
        return hours * 60 + minutes;
    }
    async rescheduleNotification(notification, newTime) {
        notification.scheduledAt = newTime;
        await this.notificationRepository.save(notification);
    }
    async markNotificationAsCancelled(notification) {
        notification.status = 'cancelled';
        notification.cancelledAt = this.clock.now();
        await this.notificationRepository.save(notification);
    }
    async markNotificationAsSent(notification, sentAt) {
        notification.status = 'sent';
        notification.sentAt = sentAt;
        await this.notificationRepository.save(notification);
    }
    async handleSendFailure(notification, error) {
        notification.status = 'failed';
        notification.failureReason = error;
        notification.failedAt = this.clock.now();
        notification.retryCount = (notification.retryCount || 0) + 1;
        // 재시도 로직 (최대 3회)
        if (notification.retryCount < 3) {
            const retryDelay = Math.pow(2, notification.retryCount) * 5 * 60 * 1000; // 5분, 10분, 20분
            notification.scheduledAt = new Date(this.clock.now().getTime() + retryDelay);
            notification.status = 'pending';
        }
        await this.notificationRepository.save(notification);
    }
}
//# sourceMappingURL=ProcessNotificationQueueUseCase.js.map