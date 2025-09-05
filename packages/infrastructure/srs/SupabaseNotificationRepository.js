import { Result } from '@woodie/domain';
export class SupabaseNotificationRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findPendingNotifications(options) {
        try {
            let query = this.supabase
                .from('notifications')
                .select('*')
                .eq('status', 'pending')
                .order('priority', { ascending: false })
                .order('scheduled_at', { ascending: true });
            if (options.priority) {
                query = query.eq('priority', options.priority);
            }
            if (options.deliveryMethod) {
                query = query.eq('delivery_method', options.deliveryMethod);
            }
            if (options.scheduledBefore) {
                query = query.lte('scheduled_at', options.scheduledBefore.toISOString());
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            const { data, error } = await query;
            if (error) {
                return Result.fail(`Failed to find pending notifications: ${error.message}`);
            }
            return Result.ok(data || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding pending notifications: ${error}`);
        }
    }
    async countPendingNotifications(options) {
        try {
            let query = this.supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (options.scheduledBefore) {
                query = query.lte('scheduled_at', options.scheduledBefore.toISOString());
            }
            const { count, error } = await query;
            if (error) {
                return Result.fail(`Failed to count pending notifications: ${error.message}`);
            }
            return Result.ok(count || 0);
        }
        catch (error) {
            return Result.fail(`Unexpected error counting pending notifications: ${error}`);
        }
    }
    async save(notification) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .upsert(notification);
            if (error) {
                return Result.fail(`Failed to save notification: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error saving notification: ${error}`);
        }
    }
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('id', id.toString())
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                return Result.fail(`Failed to find notification: ${error.message}`);
            }
            return Result.ok(data || null);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding notification: ${error}`);
        }
    }
    async updateStatus(id, status, metadata) {
        try {
            const updateData = {
                status,
                updated_at: new Date().toISOString()
            };
            if (status === 'sent') {
                updateData.sent_at = new Date().toISOString();
            }
            if (metadata) {
                if (metadata.failureReason) {
                    updateData.failure_reason = metadata.failureReason;
                }
                if (metadata.processingTimeMs) {
                    updateData.processing_time_ms = metadata.processingTimeMs;
                }
            }
            const { error } = await this.supabase
                .from('notifications')
                .update(updateData)
                .eq('id', id.toString());
            if (error) {
                return Result.fail(`Failed to update notification status: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error updating notification status: ${error}`);
        }
    }
    // 통계를 위한 추가 메서드들
    async findRecentNotifications(days = 7) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find recent notifications: ${error.message}`);
            }
            return Result.ok(data || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding recent notifications: ${error}`);
        }
    }
    async findByStudentAndPeriod(studentId, fromDate, toDate) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('student_id', studentId.toString())
                .gte('created_at', fromDate.toISOString())
                .lte('created_at', toDate.toISOString())
                .order('created_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find notifications by student and period: ${error.message}`);
            }
            return Result.ok(data || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding notifications by student and period: ${error}`);
        }
    }
    async findScheduledByStudentId(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('student_id', studentId.toString())
                .eq('status', 'pending')
                .order('scheduled_at', { ascending: true });
            if (error) {
                return Result.fail(`Failed to find scheduled notifications: ${error.message}`);
            }
            return Result.ok(data || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding scheduled notifications: ${error}`);
        }
    }
    async findSentByStudentId(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('student_id', studentId.toString())
                .eq('status', 'sent')
                .order('sent_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find sent notifications: ${error.message}`);
            }
            return Result.ok(data || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding sent notifications: ${error}`);
        }
    }
    async delete(id) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .delete()
                .eq('id', id.toString());
            if (error) {
                return Result.fail(`Failed to delete notification: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error deleting notification: ${error}`);
        }
    }
    async getDeliveryStats(days = 7) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const { data, error } = await this.supabase
                .from('notifications')
                .select('status, delivery_method, type, processing_time_ms')
                .gte('created_at', since.toISOString());
            if (error) {
                return Result.fail(`Failed to get delivery stats: ${error.message}`);
            }
            // 통계 계산
            const stats = {
                total: data?.length || 0,
                sent: data?.filter((n) => n.status === 'sent').length || 0,
                failed: data?.filter((n) => n.status === 'failed').length || 0,
                pending: data?.filter((n) => n.status === 'pending').length || 0,
                byDeliveryMethod: {},
                byType: {},
                avgProcessingTimeMs: 0
            };
            if (data && data.length > 0) {
                // 전송 방법별 통계
                const deliveryMethods = ['push', 'email', 'in_app'];
                deliveryMethods.forEach(method => {
                    const methodData = data.filter((n) => n.delivery_method === method);
                    stats.byDeliveryMethod[method] = {
                        total: methodData.length,
                        sent: methodData.filter((n) => n.status === 'sent').length,
                        failed: methodData.filter((n) => n.status === 'failed').length,
                        successRate: methodData.length > 0 ?
                            (methodData.filter((n) => n.status === 'sent').length / methodData.length * 100).toFixed(1) : '0'
                    };
                });
                // 타입별 통계
                const types = ['review_due', 'assignment_due', 'achievement'];
                types.forEach(type => {
                    const typeData = data.filter((n) => n.type === type);
                    stats.byType[type] = {
                        total: typeData.length,
                        sent: typeData.filter((n) => n.status === 'sent').length,
                        failed: typeData.filter((n) => n.status === 'failed').length
                    };
                });
                // 평균 처리 시간
                const processingTimes = data
                    .filter((n) => n.processing_time_ms !== null && n.status === 'sent')
                    .map((n) => n.processing_time_ms || 0);
                if (processingTimes.length > 0) {
                    stats.avgProcessingTimeMs = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
                }
            }
            return Result.ok(stats);
        }
        catch (error) {
            return Result.fail(`Unexpected error getting delivery stats: ${error}`);
        }
    }
}
//# sourceMappingURL=SupabaseNotificationRepository.js.map