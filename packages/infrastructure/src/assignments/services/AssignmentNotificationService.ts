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

export class AssignmentNotificationService {
  private readonly NOTIFICATION_CACHE_PREFIX = 'assignment_notification:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private supabase: SupabaseClient,
    private notificationService: INotificationService,
    private cache?: ICacheService
  ) {}

  async notifyAssignmentCreated(assignment: Assignment): Promise<Result<void>> {
    try {
      const payload: AssignmentNotificationPayload = {
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
      } else {
        await this.notifyStudentAssignment(payload);
      }

      // Cache notification to prevent duplicates
      await this.cacheNotification('created', payload.assignmentId);

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to send assignment creation notification: ${error}`);
    }
  }

  async notifyAssignmentDueDateChanged(
    assignment: Assignment, 
    oldDueDate: Date, 
    reason: 'changed' | 'extended'
  ): Promise<Result<void>> {
    try {
      const payload: DueDateNotificationPayload = {
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

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to send due date change notification: ${error}`);
    }
  }

  async notifyAssignmentOverdue(assignment: Assignment): Promise<Result<void>> {
    try {
      const notificationKey = `overdue_${assignment.id.toString()}`;
      
      // Check if already notified
      if (await this.wasAlreadyNotified(notificationKey)) {
        return Result.ok<void>();
      }

      const payload: AssignmentNotificationPayload = {
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

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to send overdue notification: ${error}`);
    }
  }

  async notifyAssignmentDueSoon(assignment: Assignment): Promise<Result<void>> {
    try {
      const notificationKey = `due_soon_${assignment.id.toString()}`;
      
      // Check if already notified
      if (await this.wasAlreadyNotified(notificationKey)) {
        return Result.ok<void>();
      }

      const payload: AssignmentNotificationPayload = {
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

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to send due soon notification: ${error}`);
    }
  }

  private async notifyClassAssignment(payload: AssignmentNotificationPayload): Promise<void> {
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

  private async notifyStudentAssignment(payload: AssignmentNotificationPayload): Promise<void> {
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

  private async notifyDueDateChange(payload: DueDateNotificationPayload): Promise<void> {
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

  private async notifyOverdueAssignment(payload: AssignmentNotificationPayload): Promise<void> {
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

  private async notifyDueSoonAssignment(payload: AssignmentNotificationPayload): Promise<void> {
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

  private extractTargetIds(assignment: Assignment): string[] {
    const classIds = assignment.getAssignedClasses().map(classId => classId.value);
    const studentIds = assignment.getAssignedStudents().map(studentId => studentId.value);
    return [...classIds, ...studentIds];
  }

  private determineTargetType(assignment: Assignment): 'class' | 'student' {
    const hasClasses = assignment.getAssignedClasses().length > 0;
    const hasStudents = assignment.getAssignedStudents().length > 0;
    
    if (hasClasses && !hasStudents) return 'class';
    if (!hasClasses && hasStudents) return 'student';
    
    // If both exist, prioritize class-based notifications
    return hasClasses ? 'class' : 'student';
  }

  private async cacheNotification(type: string, assignmentId: string): Promise<void> {
    if (!this.cache) return;
    
    const key = `${this.NOTIFICATION_CACHE_PREFIX}${type}:${assignmentId}`;
    await this.cache.set(key, 'sent', this.CACHE_TTL);
  }

  private async wasAlreadyNotified(notificationKey: string): Promise<boolean> {
    if (!this.cache) return false;
    
    const key = `${this.NOTIFICATION_CACHE_PREFIX}${notificationKey}`;
    const result = await this.cache.get(key);
    return result !== null;
  }
}