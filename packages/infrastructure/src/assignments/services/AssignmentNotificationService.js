import { Result } from '@woodie/domain';
export class AssignmentNotificationService {
    supabase;
    notificationService;
    cache;
    NOTIFICATION_CACHE_PREFIX = 'assignment_notification:';
    CACHE_TTL = 3600; // 1 hour
    constructor(supabase, notificationService, cache) {
        this.supabase = supabase;
        this.notificationService = notificationService;
        this.cache = cache;
    }
    async notifyAssignmentCreated(assignment) {
        try {
            const payload = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                teacherId: assignment.teacherId,
                dueDate: assignment.dueDate.value,
                targetIds: this.extractTargetIds(assignment),
                targetType: this.determineTargetType(assignment)
            };
            // Send notifications to assigned targets
            if (payload.targetType === 'class') {
                await this.notifyClassAssignment(payload);
            }
            else {
                await this.notifyStudentAssignment(payload);
            }
            // Cache notification to prevent duplicates
            await this.cacheNotification('created', payload.assignmentId);
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Failed to send assignment creation notification: ${error}`);
        }
    }
    async notifyAssignmentDueDateChanged(assignment, oldDueDate, reason) {
        try {
            const payload = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                teacherId: assignment.teacherId,
                oldDueDate,
                newDueDate: assignment.dueDate.value,
                reason,
                targetIds: this.extractTargetIds(assignment)
            };
            // Send due date change notifications
            await this.notifyDueDateChange(payload);
            // Cache notification
            await this.cacheNotification(`due_date_${reason}`, payload.assignmentId);
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Failed to send due date change notification: ${error}`);
        }
    }
    async notifyAssignmentOverdue(assignment) {
        try {
            const notificationKey = `overdue_${assignment.id.toString()}`;
            // Check if already notified
            if (await this.wasAlreadyNotified(notificationKey)) {
                return Result.ok();
            }
            const payload = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                teacherId: assignment.teacherId,
                dueDate: assignment.dueDate.value,
                targetIds: this.extractTargetIds(assignment),
                targetType: this.determineTargetType(assignment)
            };
            // Send overdue notifications
            await this.notifyOverdueAssignment(payload);
            // Cache to prevent duplicate notifications
            await this.cacheNotification('overdue', payload.assignmentId);
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Failed to send overdue notification: ${error}`);
        }
    }
    async notifyAssignmentDueSoon(assignment) {
        try {
            const notificationKey = `due_soon_${assignment.id.toString()}`;
            // Check if already notified
            if (await this.wasAlreadyNotified(notificationKey)) {
                return Result.ok();
            }
            const payload = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                teacherId: assignment.teacherId,
                dueDate: assignment.dueDate.value,
                targetIds: this.extractTargetIds(assignment),
                targetType: this.determineTargetType(assignment)
            };
            // Send due soon notifications
            await this.notifyDueSoonAssignment(payload);
            // Cache notification
            await this.cacheNotification('due_soon', payload.assignmentId);
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Failed to send due soon notification: ${error}`);
        }
    }
    async notifyClassAssignment(payload) {
        for (const classId of payload.targetIds) {
            // Get students in class
            const { data: students, error } = await this.supabase
                .from('auth.profiles')
                .select('id, email, full_name')
                .eq('class_id', classId)
                .eq('role', 'student')
                .eq('is_active', true);
            if (error) {
                throw new Error(`Failed to get class students: ${error.message}`);
            }
            // Send notification to each student
            for (const student of students || []) {
                await this.notificationService.sendNotification({
                    recipient: student.id,
                    type: 'assignment_assigned',
                    title: '새로운 과제가 배정되었습니다',
                    message: `${payload.title} 과제가 배정되었습니다. 마감일: ${payload.dueDate.toLocaleDateString()}`,
                    data: {
                        assignmentId: payload.assignmentId,
                        dueDate: payload.dueDate.toISOString()
                    }
                });
            }
        }
    }
    async notifyStudentAssignment(payload) {
        for (const studentId of payload.targetIds) {
            await this.notificationService.sendNotification({
                recipient: studentId,
                type: 'assignment_assigned',
                title: '새로운 과제가 배정되었습니다',
                message: `${payload.title} 과제가 배정되었습니다. 마감일: ${payload.dueDate.toLocaleDateString()}`,
                data: {
                    assignmentId: payload.assignmentId,
                    dueDate: payload.dueDate.toISOString()
                }
            });
        }
    }
    async notifyDueDateChange(payload) {
        const message = payload.reason === 'extended'
            ? `${payload.title} 과제의 마감일이 연장되었습니다. 새 마감일: ${payload.newDueDate.toLocaleDateString()}`
            : `${payload.title} 과제의 마감일이 변경되었습니다. 새 마감일: ${payload.newDueDate.toLocaleDateString()}`;
        for (const targetId of payload.targetIds) {
            await this.notificationService.sendNotification({
                recipient: targetId,
                type: 'assignment_due_date_changed',
                title: '과제 마감일 변경',
                message,
                data: {
                    assignmentId: payload.assignmentId,
                    oldDueDate: payload.oldDueDate.toISOString(),
                    newDueDate: payload.newDueDate.toISOString(),
                    reason: payload.reason
                }
            });
        }
    }
    async notifyOverdueAssignment(payload) {
        // Notify teacher
        await this.notificationService.sendNotification({
            recipient: payload.teacherId,
            type: 'assignment_overdue',
            title: '과제 마감 알림',
            message: `${payload.title} 과제가 마감되었습니다.`,
            data: {
                assignmentId: payload.assignmentId,
                dueDate: payload.dueDate.toISOString()
            }
        });
        // Notify students (if needed for late submissions)
        for (const targetId of payload.targetIds) {
            await this.notificationService.sendNotification({
                recipient: targetId,
                type: 'assignment_overdue',
                title: '과제 마감 알림',
                message: `${payload.title} 과제가 마감되었습니다.`,
                data: {
                    assignmentId: payload.assignmentId,
                    dueDate: payload.dueDate.toISOString()
                }
            });
        }
    }
    async notifyDueSoonAssignment(payload) {
        const hoursUntilDue = Math.max(0, Math.floor((payload.dueDate.getTime() - Date.now()) / (1000 * 60 * 60)));
        const message = `${payload.title} 과제 마감이 ${hoursUntilDue}시간 남았습니다.`;
        for (const targetId of payload.targetIds) {
            await this.notificationService.sendNotification({
                recipient: targetId,
                type: 'assignment_due_soon',
                title: '과제 마감 임박',
                message,
                data: {
                    assignmentId: payload.assignmentId,
                    dueDate: payload.dueDate.toISOString(),
                    hoursUntilDue
                }
            });
        }
    }
    extractTargetIds(assignment) {
        const classIds = assignment.getAssignedClasses().map(classId => classId.value);
        const studentIds = assignment.getAssignedStudents().map(studentId => studentId.value);
        return [...classIds, ...studentIds];
    }
    determineTargetType(assignment) {
        const hasClasses = assignment.getAssignedClasses().length > 0;
        const hasStudents = assignment.getAssignedStudents().length > 0;
        if (hasClasses && !hasStudents)
            return 'class';
        if (!hasClasses && hasStudents)
            return 'student';
        // If both exist, prioritize class-based notifications
        return hasClasses ? 'class' : 'student';
    }
    async cacheNotification(type, assignmentId) {
        if (!this.cache)
            return;
        const key = `${this.NOTIFICATION_CACHE_PREFIX}${type}:${assignmentId}`;
        await this.cache.set(key, 'sent', this.CACHE_TTL);
    }
    async wasAlreadyNotified(notificationKey) {
        if (!this.cache)
            return false;
        const key = `${this.NOTIFICATION_CACHE_PREFIX}${notificationKey}`;
        const result = await this.cache.get(key);
        return result !== null;
    }
}
//# sourceMappingURL=AssignmentNotificationService.js.map