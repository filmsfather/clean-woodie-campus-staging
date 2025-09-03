import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';
interface AssignmentHistoryProps {
    assignedAt: Date;
    assignedBy: string;
    revokedAt?: Date;
    revokedBy?: string;
}
export declare class AssignmentHistory {
    private props;
    constructor(props: AssignmentHistoryProps);
    get assignedAt(): Date;
    get assignedBy(): string;
    get revokedAt(): Date | undefined;
    get revokedBy(): string | undefined;
    isActive(): boolean;
    revoke(revokedBy: string): AssignmentHistory;
}
interface AssignmentTargetProps {
    assignmentId: UniqueEntityID;
    targetIdentifier: AssignmentTargetIdentifier;
    history: AssignmentHistory[];
}
export declare class AssignmentTarget extends Entity<UniqueEntityID> {
    private _assignmentId;
    private _targetIdentifier;
    private _history;
    constructor(props: AssignmentTargetProps, id?: UniqueEntityID);
    get assignmentId(): UniqueEntityID;
    get targetIdentifier(): AssignmentTargetIdentifier;
    get history(): AssignmentHistory[];
    isActive(): boolean;
    getLatestHistory(): AssignmentHistory | undefined;
    addAssignmentHistory(assignedBy: string): void;
    revokeAssignment(revokedBy: string): Result<void>;
    isAssignedTo(targetIdentifier: AssignmentTargetIdentifier): boolean;
    belongsToAssignment(assignmentId: UniqueEntityID): boolean;
    isClassTarget(): boolean;
    isStudentTarget(): boolean;
    getTargetId(): string;
    static create(assignmentId: UniqueEntityID, targetIdentifier: AssignmentTargetIdentifier, assignedBy: string, id?: UniqueEntityID): Result<AssignmentTarget>;
}
export {};
//# sourceMappingURL=AssignmentTarget.d.ts.map