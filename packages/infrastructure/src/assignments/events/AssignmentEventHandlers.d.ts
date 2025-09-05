import { IEventDispatcher } from '@woodie/domain';
import { ILogger } from '../../common/interfaces/ILogger';
import { AssignmentNotificationService } from '../services/AssignmentNotificationService';
import { CachedAssignmentService } from '../services/CachedAssignmentService';
import { AssignmentService } from '@woodie/domain';
export declare class AssignmentEventHandlers {
    private eventDispatcher;
    private assignmentService;
    private notificationService;
    private cachedAssignmentService;
    private logger;
    constructor(eventDispatcher: IEventDispatcher, assignmentService: AssignmentService, notificationService: AssignmentNotificationService, cachedAssignmentService: CachedAssignmentService, logger: ILogger);
    private registerEventHandlers;
    private handleAssignmentCreated;
    private handleAssignmentActivated;
    private handleAssignmentTargetAdded;
    private handleAssignmentTargetRevoked;
    private handleAssignmentDueDateChanged;
    private handleAssignmentDueDateExtended;
    private handleAssignmentOverdue;
    private handleAssignmentClosed;
    private invalidateCachesForAssignmentChange;
    private invalidateCachesForDueDateChange;
}
//# sourceMappingURL=AssignmentEventHandlers.d.ts.map