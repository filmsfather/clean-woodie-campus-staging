import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { Assignment, AssignmentStatus } from '../entities/Assignment';
import { IAssignmentRepository } from '../repositories/IAssignmentRepository';
export interface CreateAssignmentRequest {
    teacherId: string;
    problemSetId: UniqueEntityID;
    title: string;
    description?: string;
    dueDate: Date;
    timezone?: string;
    maxAttempts?: number;
    classIds?: string[];
    studentIds?: string[];
}
export interface AssignmentTargetRequest {
    classIds?: string[];
    studentIds?: string[];
}
export interface AssignmentDueDateStatus {
    assignmentId: string;
    title: string;
    dueDate: Date;
    status: string;
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    assignmentStatus: AssignmentStatus;
    activeTargetCount: number;
}
export declare class AssignmentService {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    createAssignmentWithTargets(request: CreateAssignmentRequest, createdBy: string): Promise<Result<Assignment>>;
    assignTargets(assignment: Assignment, targets: AssignmentTargetRequest, assignedBy: string): Promise<Result<void>>;
    revokeAssignmentTargets(assignmentId: UniqueEntityID, targets: AssignmentTargetRequest, revokedBy: string): Promise<Result<void>>;
    activateAssignment(assignmentId: UniqueEntityID, teacherId: string): Promise<Result<void>>;
    getAccessibleAssignmentsForStudent(studentId: string): Promise<Result<Assignment[]>>;
    getAssignmentsForClass(classId: string): Promise<Result<Assignment[]>>;
    extendAssignmentDueDate(assignmentId: UniqueEntityID, additionalHours: number, teacherId: string): Promise<Result<void>>;
    changeAssignmentDueDate(assignmentId: UniqueEntityID, newDueDate: Date, teacherId: string, timezone?: string): Promise<Result<void>>;
    getAssignmentsDueSoon(hoursThreshold?: number): Promise<Result<Assignment[]>>;
    getOverdueAssignments(): Promise<Result<Assignment[]>>;
    getTeacherAssignmentsDueDateStatus(teacherId: string): Promise<Result<AssignmentDueDateStatus[]>>;
    processOverdueAssignments(): Promise<Result<number>>;
    private validateAssignmentTargets;
}
//# sourceMappingURL=AssignmentService.d.ts.map