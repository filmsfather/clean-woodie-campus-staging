import { AssignmentService } from '@woodie/domain';
import { Result } from '@woodie/domain';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { AssignmentNotificationService } from '../services/AssignmentNotificationService';
export interface AssignmentDueDateExecutorConfig {
    dueSoonThresholdHours: number;
    batchSize: number;
    processingIntervalMinutes: number;
}
export interface ExecutionResult {
    processedAssignments: number;
    dueSoonNotifications: number;
    overdueNotifications: number;
    closedAssignments: number;
    errors: string[];
}
export declare class AssignmentDueDateExecutor {
    private assignmentService;
    private notificationService;
    private logger;
    private cache?;
    private config;
    private readonly EXECUTION_LOCK_KEY;
    private readonly LOCK_TTL;
    private isRunning;
    constructor(assignmentService: AssignmentService, notificationService: AssignmentNotificationService, logger: ILogger, cache?: ICacheService | undefined, config?: AssignmentDueDateExecutorConfig);
    execute(): Promise<Result<ExecutionResult>>;
    private processDueSoonAssignments;
    private processOverdueAssignments;
    private autoCloseOverdueAssignments;
    private acquireLock;
    private releaseLock;
    executeOnce(): Promise<Result<ExecutionResult>>;
    isHealthy(): boolean;
    getConfig(): AssignmentDueDateExecutorConfig;
}
//# sourceMappingURL=AssignmentDueDateExecutor.d.ts.map