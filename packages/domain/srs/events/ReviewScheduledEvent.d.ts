import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export declare class ReviewScheduledEvent extends BaseDomainEvent {
    readonly reviewScheduleId: UniqueEntityID;
    readonly studentId: UniqueEntityID;
    readonly problemId: UniqueEntityID;
    readonly scheduledAt: Date;
    readonly eventType = "ReviewScheduled";
    constructor(reviewScheduleId: UniqueEntityID, studentId: UniqueEntityID, problemId: UniqueEntityID, scheduledAt: Date);
}
//# sourceMappingURL=ReviewScheduledEvent.d.ts.map