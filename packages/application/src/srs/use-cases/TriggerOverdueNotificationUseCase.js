import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 연체 복습 알림 트리거 Use Case
 *
 * 비즈니스 규칙:
 * - 연체된 복습 일정에 대해서만 알림을 발송함
 * - 특정 스케줄 또는 학생의 모든 연체 항목 처리 가능
 * - 배치 처리로 대량의 연체 항목 처리 지원
 * - 이미 알림이 발송된 항목은 중복 발송하지 않음
 */
export class TriggerOverdueNotificationUseCase {
    reviewScheduleRepository;
    clock;
    constructor(reviewScheduleRepository, clock) {
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.clock = clock;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            let schedules = [];
            // 2. 처리할 스케줄 조회
            if (request.scheduleId) {
                // 특정 스케줄 처리
                const scheduleId = new UniqueEntityID(request.scheduleId);
                const schedule = await this.reviewScheduleRepository.findById(scheduleId);
                if (schedule) {
                    schedules = [schedule];
                }
            }
            else if (request.studentId) {
                // 특정 학생의 연체 항목들 처리
                const studentId = new UniqueEntityID(request.studentId);
                schedules = await this.reviewScheduleRepository.findOverdueByStudentId(studentId, new Date());
            }
            else {
                // 전체 연체 항목들 배치 처리
                schedules = await this.reviewScheduleRepository.findOverdueSchedules(new Date());
            }
            // 3. 각 스케줄에 대해 알림 트리거 처리
            const results = [];
            let notificationsTriggered = 0;
            for (const schedule of schedules) {
                const wasOverdue = schedule.isOverdue(this.clock);
                // 연체 알림 트리거
                schedule.triggerOverdueNotification(this.clock);
                const overdueHours = wasOverdue
                    ? Math.floor((this.clock.now().getTime() - schedule.nextReviewAt.getTime()) / (1000 * 60 * 60))
                    : 0;
                const result = {
                    scheduleId: schedule.id.toString(),
                    studentId: schedule.studentId.toString(),
                    problemId: schedule.problemId.toString(),
                    overdueHours,
                    notificationTriggered: wasOverdue
                };
                results.push(result);
                if (wasOverdue) {
                    notificationsTriggered++;
                    // 스케줄 업데이트 (도메인 이벤트가 발행되었으므로 저장 필요)
                    await this.reviewScheduleRepository.save(schedule);
                }
            }
            // 4. 응답 구성
            const response = {
                processedSchedules: results,
                totalProcessed: results.length,
                notificationsTriggered,
                batchCompleted: schedules.length < (request.batchSize || 100)
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to trigger overdue notifications: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (request.batchSize !== undefined && request.batchSize <= 0) {
            return Result.fail('Batch size must be a positive number');
        }
        if (request.batchSize !== undefined && request.batchSize > 1000) {
            return Result.fail('Batch size cannot exceed 1000');
        }
        return Result.ok();
    }
}
//# sourceMappingURL=TriggerOverdueNotificationUseCase.js.map