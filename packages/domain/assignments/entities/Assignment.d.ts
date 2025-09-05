import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTarget } from './AssignmentTarget';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';
import { ClassId } from '../value-objects/ClassId';
import { StudentId } from '../value-objects/StudentId';
import { DueDate } from '../value-objects/DueDate';
interface AssignmentProps {
    teacherId: string;
    problemSetId: UniqueEntityID;
    title: string;
    description?: string;
    dueDate: DueDate;
    maxAttempts?: number;
    isActive: boolean;
    targets?: AssignmentTarget[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare enum AssignmentStatus {
    DRAFT = "DRAFT",// 초안 상태 (학생에게 공개되지 않음)
    ACTIVE = "ACTIVE",// 활성 상태 (학생이 접근 가능)
    CLOSED = "CLOSED",// 마감된 상태 (새로운 제출 불가)
    ARCHIVED = "ARCHIVED"
}
export declare class Assignment extends AggregateRoot<UniqueEntityID> {
    private _teacherId;
    private _problemSetId;
    private _title;
    private _description?;
    private _dueDate;
    private _maxAttempts?;
    private _status;
    private _targets;
    private _createdAt;
    private _updatedAt;
    constructor(props: AssignmentProps, id?: UniqueEntityID);
    get teacherId(): string;
    get problemSetId(): UniqueEntityID;
    get title(): string;
    get description(): string | undefined;
    get dueDate(): DueDate;
    get maxAttempts(): number | undefined;
    get status(): AssignmentStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get targets(): AssignmentTarget[];
    get activeTargets(): AssignmentTarget[];
    updateTitle(title: string): Result<void>;
    updateDescription(description: string): Result<void>;
    updateDueDate(dueDate: DueDate): Result<void>;
    extendDueDate(additionalHours: number, extendedBy?: string): Result<void>;
    changeDueDateTo(newDueDate: Date, timezone?: string, changedBy?: string, reason?: string): Result<void>;
    setMaxAttempts(maxAttempts: number): Result<void>;
    setUnlimitedAttempts(): void;
    activate(): Result<void>;
    deactivate(): void;
    close(): Result<void>;
    archive(): void;
    isActive(): boolean;
    isOverdue(): boolean;
    isDueSoon(hoursThreshold?: number): boolean;
    getHoursUntilDue(): number;
    getDaysUntilDue(): number;
    getDueDateStatus(): string;
    isAccessibleToStudents(): boolean;
    isOwnedBy(teacherId: string): boolean;
    hasAttemptLimit(): boolean;
    assignToClass(classId: ClassId, assignedBy: string): Result<void>;
    assignToStudent(studentId: StudentId, assignedBy: string): Result<void>;
    assignToMultipleTargets(targetIdentifiers: AssignmentTargetIdentifier[], assignedBy: string): Result<void>;
    revokeAssignment(targetIdentifier: AssignmentTargetIdentifier, revokedBy: string): Result<void>;
    revokeAllAssignments(revokedBy: string): Result<void>;
    isAlreadyAssignedTo(targetIdentifier: AssignmentTargetIdentifier): boolean;
    isAssignedToClass(classId: ClassId): boolean;
    isAssignedToStudent(studentId: StudentId): boolean;
    getAssignedClasses(): ClassId[];
    getAssignedStudents(): StudentId[];
    hasActiveAssignments(): boolean;
    getActiveAssignmentCount(): number;
    static create(props: Omit<AssignmentProps, 'isActive'>, id?: UniqueEntityID): Result<Assignment>;
    static createActive(props: Omit<AssignmentProps, 'isActive'>, id?: UniqueEntityID): Result<Assignment>;
    static restore(props: {
        id: string;
        teacherId: string;
        problemSetId: string;
        title: string;
        description?: string;
        dueDate: DueDate;
        maxAttempts?: number;
        status: AssignmentStatus;
        targets?: AssignmentTarget[];
        createdAt: Date;
        updatedAt: Date;
    }): Result<Assignment>;
    toPersistence(): {
        id: string;
        teacherId: string;
        problemSetId: string;
        title: string;
        description?: string;
        dueDate: Date;
        maxAttempts?: number;
        status: AssignmentStatus;
        targets?: Array<{
            id: string;
            targetType: string;
            targetId: string;
            assignedBy: string;
            assignedAt: Date;
            revokedBy?: string;
            revokedAt?: Date;
            isActive: boolean;
        }>;
        createdAt: Date;
        updatedAt: Date;
    };
}
export {};
//# sourceMappingURL=Assignment.d.ts.map