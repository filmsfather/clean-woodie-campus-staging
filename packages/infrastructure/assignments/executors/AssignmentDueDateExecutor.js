import { Result } from '@woodie/domain';
export class AssignmentDueDateExecutor {
    assignmentService;
    notificationService;
    logger;
    cache;
    config;
    EXECUTION_LOCK_KEY = 'assignment_due_date_executor:lock';
    LOCK_TTL = 300; // 5 minutes
    isRunning = false;
    constructor(assignmentService, notificationService, logger, cache, config = {
        dueSoonThresholdHours: 24,
        batchSize: 50,
        processingIntervalMinutes: 60
    }) {
        this.assignmentService = assignmentService;
        this.notificationService = notificationService;
        this.logger = logger;
        this.cache = cache;
        this.config = config;
    }
    async execute() {
        if (this.isRunning) {
            return Result.fail('Executor is already running');
        }
        // Acquire distributed lock if cache is available
        const lockAcquired = await this.acquireLock();
        if (!lockAcquired) {
            return Result.fail('Could not acquire execution lock');
        }
        this.isRunning = true;
        try {
            this.logger.info('Starting Assignment Due Date Executor');
            const result = {
                processedAssignments: 0,
                dueSoonNotifications: 0,
                overdueNotifications: 0,
                closedAssignments: 0,
                errors: []
            };
            // Process due soon assignments
            await this.processDueSoonAssignments(result);
            // Process overdue assignments
            await this.processOverdueAssignments(result);
            // Auto-close overdue assignments
            await this.autoCloseOverdueAssignments(result);
            this.logger.info('Assignment Due Date Executor completed', { result });
            return Result.ok(result);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Assignment Due Date Executor failed', { error: errorMessage });
            return Result.fail(`Executor failed: ${errorMessage}`);
        }
        finally {
            this.isRunning = false;
            await this.releaseLock();
        }
    }
    async processDueSoonAssignments(result) {
        try {
            this.logger.info('Processing due soon assignments');
            const dueSoonResult = await this.assignmentService.getAssignmentsDueSoon(this.config.dueSoonThresholdHours);
            if (dueSoonResult.isFailure) {
                result.errors.push(`Failed to get due soon assignments: ${dueSoonResult.error}`);
                return;
            }
            const dueSoonAssignments = dueSoonResult.value;
            this.logger.info(`Found ${dueSoonAssignments.length} assignments due soon`);
            for (const assignment of dueSoonAssignments) {
                try {
                    // Send due soon notification
                    const notificationResult = await this.notificationService.notifyAssignmentDueSoon(assignment);
                    if (notificationResult.isSuccess) {
                        result.dueSoonNotifications++;
                        this.logger.debug(`Sent due soon notification for assignment ${assignment.id.toString()}`);
                    }
                    else {
                        result.errors.push(`Failed to send due soon notification for assignment ${assignment.id.toString()}: ${notificationResult.error}`);
                    }
                    result.processedAssignments++;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    result.errors.push(`Error processing due soon assignment ${assignment.id.toString()}: ${errorMessage}`);
                    this.logger.error('Error processing due soon assignment', {
                        assignmentId: assignment.id.toString(),
                        error: errorMessage
                    });
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error in processDueSoonAssignments: ${errorMessage}`);
            this.logger.error('Error in processDueSoonAssignments', { error: errorMessage });
        }
    }
    async processOverdueAssignments(result) {
        try {
            this.logger.info('Processing overdue assignments');
            const overdueResult = await this.assignmentService.getOverdueAssignments();
            if (overdueResult.isFailure) {
                result.errors.push(`Failed to get overdue assignments: ${overdueResult.error}`);
                return;
            }
            const overdueAssignments = overdueResult.value;
            this.logger.info(`Found ${overdueAssignments.length} overdue assignments`);
            for (const assignment of overdueAssignments) {
                try {
                    // Send overdue notification
                    const notificationResult = await this.notificationService.notifyAssignmentOverdue(assignment);
                    if (notificationResult.isSuccess) {
                        result.overdueNotifications++;
                        this.logger.debug(`Sent overdue notification for assignment ${assignment.id.toString()}`);
                    }
                    else {
                        result.errors.push(`Failed to send overdue notification for assignment ${assignment.id.toString()}: ${notificationResult.error}`);
                    }
                    result.processedAssignments++;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    result.errors.push(`Error processing overdue assignment ${assignment.id.toString()}: ${errorMessage}`);
                    this.logger.error('Error processing overdue assignment', {
                        assignmentId: assignment.id.toString(),
                        error: errorMessage
                    });
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error in processOverdueAssignments: ${errorMessage}`);
            this.logger.error('Error in processOverdueAssignments', { error: errorMessage });
        }
    }
    async autoCloseOverdueAssignments(result) {
        try {
            this.logger.info('Auto-closing overdue assignments');
            // Use domain service to process overdue assignments
            const closeResult = await this.assignmentService.processOverdueAssignments();
            if (closeResult.isFailure) {
                result.errors.push(`Failed to auto-close overdue assignments: ${closeResult.error}`);
                return;
            }
            result.closedAssignments = closeResult.value;
            this.logger.info(`Auto-closed ${result.closedAssignments} overdue assignments`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error in autoCloseOverdueAssignments: ${errorMessage}`);
            this.logger.error('Error in autoCloseOverdueAssignments', { error: errorMessage });
        }
    }
    async acquireLock() {
        if (!this.cache) {
            // If no cache service available, proceed anyway (single instance assumption)
            return true;
        }
        try {
            const lockValue = `${Date.now()}_${Math.random()}`;
            const acquired = await this.cache.setIfNotExists(this.EXECUTION_LOCK_KEY, lockValue, this.LOCK_TTL);
            if (acquired) {
                this.logger.debug('Acquired execution lock');
                return true;
            }
            else {
                this.logger.warn('Could not acquire execution lock - another instance may be running');
                return false;
            }
        }
        catch (error) {
            this.logger.error('Error acquiring execution lock', { error });
            return false;
        }
    }
    async releaseLock() {
        if (!this.cache)
            return;
        try {
            await this.cache.delete(this.EXECUTION_LOCK_KEY);
            this.logger.debug('Released execution lock');
        }
        catch (error) {
            this.logger.error('Error releasing execution lock', { error });
        }
    }
    // Method for manual execution (useful for testing or manual triggers)
    async executeOnce() {
        return this.execute();
    }
    // Health check method
    isHealthy() {
        return !this.isRunning;
    }
    // Configuration getter
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=AssignmentDueDateExecutor.js.map