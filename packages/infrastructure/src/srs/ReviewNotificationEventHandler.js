/**
 * ReviewNotificationScheduled 이벤트 핸들러
 * 복습 일정 변경 시 발생하는 알림 이벤트를 처리하여 실시간 알림 전송
 *
 * 이벤트 처리 전략:
 * - 즉시 전송: 연체 알림, 긴급 알림
 * - 예약 전송: 일반 복습 알림 (별도 스케줄러 필요)
 * - 배치 처리: 여러 사용자에게 동시에 알림 전송
 */
export class ReviewNotificationEventHandler {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    /**
     * ReviewNotificationScheduled 이벤트 처리
     */
    async handle(event) {
        try {
            console.log(`📅 Processing notification event: ${event.eventType} for schedule ${event.scheduleId}`);
            // 1. 즉시 전송이 필요한 알림인지 확인
            if (event.shouldSendImmediately) {
                await this.sendImmediateNotification(event);
            }
            else {
                await this.scheduleDelayedNotification(event);
            }
            console.log(`✅ Successfully processed notification event for schedule ${event.scheduleId}`);
        }
        catch (error) {
            // ⭐ 실제 운영 환경에서는 재시도 큐나 데드레터 큐로 전송
            console.error('Failed to handle ReviewNotificationScheduledEvent:', {
                eventId: event.aggregateId,
                scheduleId: event.scheduleId.toString(),
                studentId: event.studentId.toString(),
                error: error instanceof Error ? error.message : error
            });
            // 필요시 재시도 로직 또는 알림 발송
            throw error; // 상위로 에러 전파하여 재시도 가능하게 함
        }
    }
    /**
     * 즉시 전송 알림 처리
     * 연체 알림, 긴급 알림 등
     */
    async sendImmediateNotification(event) {
        const { title, body } = this.generateNotificationContent(event);
        const result = await this.notificationService.sendImmediateNotification(event.studentId, event.notificationType, title, body, event.getNotificationData());
        if (result.isFailure) {
            throw new Error(`Failed to send immediate notification: ${result.error}`);
        }
        console.log(`📬 Immediate notification sent to student ${event.studentId}`);
    }
    /**
     * 지연 전송 알림 처리
     * 실제로는 스케줄러나 큐 시스템에 등록
     * 현재 구현에서는 로깅만 수행
     */
    async scheduleDelayedNotification(event) {
        const timeUntilNotification = event.getTimeUntilNotification();
        const scheduledTime = new Date(Date.now() + timeUntilNotification);
        console.log(`⏰ Scheduling notification for ${scheduledTime.toISOString()}:`, {
            scheduleId: event.scheduleId.toString(),
            studentId: event.studentId.toString(),
            type: event.notificationType.value,
            minutesUntilSend: Math.floor(timeUntilNotification / (1000 * 60))
        });
        // ⭐ 실제 구현에서는 여기서 스케줄링 시스템에 등록
        // 예: Redis 기반 지연 큐, PostgreSQL의 pg_cron, 또는 별도 스케줄러 서비스
        /*
        // 예시: Redis 기반 지연 작업 큐에 등록
        await this.delayedJobQueue.schedule(
          'send_review_notification',
          {
            studentId: event.studentId.toString(),
            scheduleId: event.scheduleId.toString(),
            notificationType: event.notificationType.value,
            notificationData: event.getNotificationData()
          },
          scheduledTime
        )
        */
    }
    /**
     * 알림 내용 생성
     * 알림 타입과 메타데이터를 기반으로 적절한 메시지 생성
     */
    generateNotificationContent(event) {
        const metadata = event.metadata || {};
        switch (event.notificationType.value) {
            case 'review_due':
                if (metadata.notificationReason === 'difficult_problem_early_reminder') {
                    return {
                        title: '🎯 어려운 문제 복습 알림',
                        body: `${metadata.reminderMinutesBefore}분 후 복습할 문제가 있어요. 미리 준비해보세요!`
                    };
                }
                else {
                    return {
                        title: '📚 복습 시간 알림',
                        body: `복습할 문제가 준비되었어요. 지금 학습하러 가볼까요?`
                    };
                }
            case 'review_overdue':
                const overdueHours = metadata.overdueHours || 0;
                let urgencyMessage = '';
                if (overdueHours > 24) {
                    urgencyMessage = '이미 하루 이상 지났어요! 😰';
                }
                else if (overdueHours > 12) {
                    urgencyMessage = '반나절 이상 지났어요 ⚠️';
                }
                else {
                    urgencyMessage = '복습 시간이 지났어요 ⏰';
                }
                return {
                    title: '🚨 연체된 복습 알림',
                    body: `${urgencyMessage} 기억이 흐려지기 전에 복습해보세요.`
                };
            case 'daily_summary':
                return {
                    title: '📊 오늘의 학습 요약',
                    body: '오늘 하루 학습 현황을 확인해보세요!'
                };
            case 'milestone':
                return {
                    title: '🎉 학습 성취 달성!',
                    body: '새로운 학습 목표를 달성했어요. 축하합니다!'
                };
            default:
                return {
                    title: '📱 WOODIECAMPUS 알림',
                    body: '새로운 알림이 있습니다.'
                };
        }
    }
    /**
     * 이벤트 처리 가능 여부 확인
     */
    canHandle(eventType) {
        return eventType === 'ReviewNotificationScheduledEvent';
    }
    /**
     * 배치로 여러 이벤트 처리 (성능 최적화용)
     */
    async handleBatch(events) {
        // 1. 즉시 전송과 지연 전송 분리
        const immediateEvents = events.filter(e => e.shouldSendImmediately);
        const delayedEvents = events.filter(e => !e.shouldSendImmediately);
        // 2. 즉시 전송 알림들을 배치로 처리
        if (immediateEvents.length > 0) {
            const scheduleNotificationRequests = immediateEvents.map(event => {
                const { title, body } = this.generateNotificationContent(event);
                return {
                    recipientId: event.studentId.toString(),
                    type: event.notificationType,
                    scheduledFor: new Date(),
                    title,
                    body,
                    data: event.getNotificationData()
                };
            });
            const result = await this.notificationService.sendScheduledNotifications(scheduleNotificationRequests);
            if (result.isSuccess) {
                console.log(`✅ Sent ${result.getValue()} immediate notifications in batch`);
            }
            else {
                console.error(`❌ Failed to send batch notifications: ${result.error}`);
            }
        }
        // 3. 지연 전송 알림들 스케줄링
        for (const event of delayedEvents) {
            try {
                await this.scheduleDelayedNotification(event);
            }
            catch (error) {
                console.error(`Failed to schedule delayed notification for event ${event.aggregateId}:`, error);
            }
        }
        console.log(`📦 Processed ${events.length} notification events in batch: ${immediateEvents.length} immediate, ${delayedEvents.length} delayed`);
    }
}
//# sourceMappingURL=ReviewNotificationEventHandler.js.map