import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export declare class AssignmentOverdueEvent extends BaseDomainEvent {
    readonly eventType = "AssignmentOverdue";
    readonly assignmentId: UniqueEntityID;
    readonly title: string;
    readonly dueDate: Date;
    readonly teacherId: string;
    readonly activeTargetCount: number;
    readonly overdueAt: Date;
    constructor(assignmentId: UniqueEntityID, title: string, dueDate: Date, teacherId: string, activeTargetCount: number, overdueAt?: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=AssignmentOverdueEvent.d.ts.map