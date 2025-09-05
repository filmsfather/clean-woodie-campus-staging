import { BaseDomainEvent } from '../../events/DomainEvent';
export class ReviewScheduledEvent extends BaseDomainEvent {
    reviewScheduleId;
    studentId;
    problemId;
    scheduledAt;
    eventType = 'ReviewScheduled';
    constructor(reviewScheduleId, studentId, problemId, scheduledAt) {
        super(reviewScheduleId);
        this.reviewScheduleId = reviewScheduleId;
        this.studentId = studentId;
        this.problemId = problemId;
        this.scheduledAt = scheduledAt;
    }
}
//# sourceMappingURL=ReviewScheduledEvent.js.map