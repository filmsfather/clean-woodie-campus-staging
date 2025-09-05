import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
export class UpdateReviewScheduleUseCase extends BaseUseCase {
    reviewScheduleRepository;
    constructor(reviewScheduleRepository) {
        super();
        this.reviewScheduleRepository = reviewScheduleRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 복습 스케줄 조회
            const scheduleResult = await this.reviewScheduleRepository.findById(new UniqueEntityID(request.scheduleId));
            if (!scheduleResult) {
                return Result.fail('Review schedule not found');
            }
            const schedule = scheduleResult;
            // 3. 권한 확인
            if (!this.hasUpdatePermission(schedule, request.requesterId, request.requesterRole)) {
                return Result.fail('Insufficient permissions to update this review schedule');
            }
            // 4. 스케줄 상태 확인
            if (schedule.isCompleted()) {
                return Result.fail('Cannot update completed review schedule');
            }
            // 5. 이전 값 저장 (응답용)
            const previousValues = {
                nextReviewAt: new Date(schedule.nextReviewAt),
                interval: schedule.currentInterval,
                easeFactor: schedule.easeFactor
            };
            // 6. 업데이트 적용
            const updatedFields = [];
            // 시간 조정 (postpone/advance)
            if (request.updates.postponeBy) {
                const postponeHours = (request.updates.postponeBy.days || 0) * 24 + (request.updates.postponeBy.hours || 0);
                schedule.postponeReview(postponeHours);
                updatedFields.push('postponed');
            }
            if (request.updates.advanceBy) {
                const advanceHours = (request.updates.advanceBy.days || 0) * 24 + (request.updates.advanceBy.hours || 0);
                schedule.advanceReview(advanceHours);
                updatedFields.push('advanced');
            }
            // 직접 시간 설정
            if (request.updates.nextReviewAt) {
                schedule.setNextReviewTime(request.updates.nextReviewAt);
                updatedFields.push('nextReviewAt');
            }
            // 간격 수정
            if (request.updates.currentInterval !== undefined) {
                schedule.updateInterval(request.updates.currentInterval);
                updatedFields.push('interval');
            }
            // 난이도 팩터 수정
            if (request.updates.easeFactor !== undefined) {
                schedule.updateEaseFactor(request.updates.easeFactor);
                updatedFields.push('easeFactor');
            }
            // 우선순위 수정
            if (request.updates.priority) {
                schedule.setPriority(request.updates.priority);
                updatedFields.push('priority');
            }
            // 노트 추가
            if (request.updates.notes) {
                schedule.addNote(request.updates.notes);
                updatedFields.push('notes');
            }
            // 7. 수정 이력 기록
            schedule.recordUpdate();
            // 8. 저장
            await this.reviewScheduleRepository.save(schedule);
            // 9. 응답 생성
            const response = {
                scheduleId: schedule.id.toString(),
                studentId: schedule.studentId.toString(),
                problemId: schedule.problemId.toString(),
                previousNextReviewAt: previousValues.nextReviewAt,
                newNextReviewAt: schedule.nextReviewAt,
                previousInterval: previousValues.interval,
                newInterval: schedule.currentInterval,
                previousEaseFactor: previousValues.easeFactor,
                newEaseFactor: schedule.easeFactor,
                updatedFields,
                updatedAt: new Date(),
                updatedBy: request.requesterId,
                updateReason: request.reason
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error updating review schedule: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.scheduleId || request.scheduleId.trim().length === 0) {
            errors.push('Schedule ID is required');
        }
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (!['student', 'teacher', 'admin'].includes(request.requesterRole)) {
            errors.push('Invalid requester role');
        }
        if (!request.updates || Object.keys(request.updates).length === 0) {
            errors.push('At least one field to update is required');
        }
        // 시간 관련 유효성 검증
        if (request.updates.nextReviewAt) {
            const now = new Date();
            if (request.updates.nextReviewAt < now) {
                errors.push('Next review time cannot be in the past');
            }
            const maxFutureTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1년 후
            if (request.updates.nextReviewAt > maxFutureTime) {
                errors.push('Next review time cannot be more than 1 year in the future');
            }
        }
        // 간격 유효성 검증
        if (request.updates.currentInterval !== undefined) {
            if (request.updates.currentInterval < 1 || request.updates.currentInterval > 365) {
                errors.push('Current interval must be between 1 and 365 days');
            }
        }
        // 난이도 팩터 유효성 검증
        if (request.updates.easeFactor !== undefined) {
            if (request.updates.easeFactor < 1.0 || request.updates.easeFactor > 5.0) {
                errors.push('Ease factor must be between 1.0 and 5.0');
            }
        }
        // 연기/앞당기기 유효성 검증
        if (request.updates.postponeBy) {
            const totalHours = (request.updates.postponeBy.days || 0) * 24 + (request.updates.postponeBy.hours || 0);
            if (totalHours <= 0 || totalHours > 30 * 24) { // 최대 30일
                errors.push('Postpone duration must be between 1 hour and 30 days');
            }
        }
        if (request.updates.advanceBy) {
            const totalHours = (request.updates.advanceBy.days || 0) * 24 + (request.updates.advanceBy.hours || 0);
            if (totalHours <= 0 || totalHours > 7 * 24) { // 최대 7일
                errors.push('Advance duration must be between 1 hour and 7 days');
            }
        }
        // 상충하는 업데이트 확인
        if (request.updates.nextReviewAt && (request.updates.postponeBy || request.updates.advanceBy)) {
            errors.push('Cannot set specific time and postpone/advance at the same time');
        }
        if (request.updates.postponeBy && request.updates.advanceBy) {
            errors.push('Cannot postpone and advance at the same time');
        }
        if (request.updates.notes && request.updates.notes.length > 1000) {
            errors.push('Notes must be 1000 characters or less');
        }
        if (request.reason && request.reason.length > 500) {
            errors.push('Reason must be 500 characters or less');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    hasUpdatePermission(schedule, requesterId, requesterRole) {
        // 관리자는 모든 스케줄 수정 가능
        if (requesterRole === 'admin') {
            return true;
        }
        // 교사는 자신이 관리하는 학생들의 스케줄 수정 가능 (실제로는 추가 권한 확인 필요)
        if (requesterRole === 'teacher') {
            // 실제로는 학생-교사 관계를 확인해야 함
            return true;
        }
        // 학생은 자신의 스케줄만 수정 가능
        if (requesterRole === 'student') {
            return schedule.studentId.toString() === requesterId;
        }
        return false;
    }
}
//# sourceMappingURL=UpdateReviewScheduleUseCase.js.map