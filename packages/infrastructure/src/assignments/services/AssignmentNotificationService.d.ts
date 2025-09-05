import { SupabaseClient } from '@supabase/supabase-js';
import { Assignment, Result, INotificationService } from '@woodie/domain';
import { ICacheService } from '../../common/interfaces/ICacheService';
export interface AssignmentNotificationPayload {
    assignmentId: string;
    title: string;
    teacherId: string;
    dueDate: Date;
    targetIds: string[];
    targetType: 'class' | 'student';
}
export interface DueDateNotificationPayload {
    assignmentId: string;
    title: string;
    teacherId: string;
    oldDueDate: Date;
    newDueDate: Date;
    reason: 'changed' | 'extended';
    targetIds: string[];
}
export declare class AssignmentNotificationService {
    private supabase;
    private notificationService;
    private cache?;
    private readonly NOTIFICATION_CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(supabase: SupabaseClient, notificationService: INotificationService, cache?: ICacheService | undefined);
    notifyAssignmentCreated(assignment: Assignment): Promise<Result<void>>;
    notifyAssignmentDueDateChanged(assignment: Assignment, oldDueDate: Date, reason: 'changed' | 'extended'): Promise<Result<void>>;
    notifyAssignmentOverdue(assignment: Assignment): Promise<Result<void>>;
    notifyAssignmentDueSoon(assignment: Assignment): Promise<Result<void>>;
    private notifyClassAssignment;
    private notifyStudentAssignment;
    private notifyDueDateChange;
    private notifyOverdueAssignment;
    private notifyDueSoonAssignment;
    private extractTargetIds;
    private determineTargetType;
    private cacheNotification;
    private wasAlreadyNotified;
}
//# sourceMappingURL=AssignmentNotificationService.d.ts.map