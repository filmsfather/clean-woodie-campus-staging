import { SupabaseClient } from '@supabase/supabase-js';
import { UniqueEntityID, Result } from '@woodie/domain';
interface NotificationRecord {
    id: string;
    student_id: string;
    type: 'review_due' | 'assignment_due' | 'achievement';
    priority: 'critical' | 'high' | 'medium' | 'low';
    delivery_method: 'push' | 'email' | 'in_app';
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    scheduled_at: string;
    sent_at: string | null;
    failure_reason: string | null;
    title: string;
    body: string;
    metadata: any;
    processing_time_ms: number | null;
    created_at: string;
    updated_at: string;
}
interface NotificationSearchOptions {
    limit?: number;
    priority?: string;
    deliveryMethod?: string;
    scheduledBefore?: Date;
}
export interface INotificationRepository {
    findPendingNotifications(options: NotificationSearchOptions): Promise<Result<NotificationRecord[]>>;
    countPendingNotifications(options: {
        scheduledBefore?: Date;
    }): Promise<Result<number>>;
    save(notification: NotificationRecord): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<NotificationRecord | null>>;
    updateStatus(id: UniqueEntityID, status: string, metadata?: any): Promise<Result<void>>;
    findByStudentAndPeriod(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationRecord[]>>;
    findScheduledByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>;
    findSentByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
}
export declare class SupabaseNotificationRepository implements INotificationRepository {
    private supabase;
    constructor(supabase: SupabaseClient);
    findPendingNotifications(options: NotificationSearchOptions): Promise<Result<NotificationRecord[]>>;
    countPendingNotifications(options: {
        scheduledBefore?: Date;
    }): Promise<Result<number>>;
    save(notification: NotificationRecord): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<NotificationRecord | null>>;
    updateStatus(id: UniqueEntityID, status: string, metadata?: any): Promise<Result<void>>;
    findRecentNotifications(days?: number): Promise<Result<NotificationRecord[]>>;
    findByStudentAndPeriod(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationRecord[]>>;
    findScheduledByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>;
    findSentByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    getDeliveryStats(days?: number): Promise<Result<any>>;
}
export {};
//# sourceMappingURL=SupabaseNotificationRepository.d.ts.map