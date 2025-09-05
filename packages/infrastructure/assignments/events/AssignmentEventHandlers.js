export class AssignmentEventHandlers {
    eventDispatcher;
    assignmentService;
    notificationService;
    cachedAssignmentService;
    logger;
    constructor(eventDispatcher, assignmentService, notificationService, cachedAssignmentService, logger) {
        this.eventDispatcher = eventDispatcher;
        this.assignmentService = assignmentService;
        this.notificationService = notificationService;
        this.cachedAssignmentService = cachedAssignmentService;
        this.logger = logger;
        this.registerEventHandlers();
    }
    registerEventHandlers() {
        // Assignment lifecycle events
        this.eventDispatcher.register('AssignmentCreated', this.handleAssignmentCreated.bind(this));
        this.eventDispatcher.register('AssignmentActivated', this.handleAssignmentActivated.bind(this));
        this.eventDispatcher.register('AssignmentClosed', this.handleAssignmentClosed.bind(this));
        // Assignment target events
        this.eventDispatcher.register('AssignmentTargetAdded', this.handleAssignmentTargetAdded.bind(this));
        this.eventDispatcher.register('AssignmentTargetRevoked', this.handleAssignmentTargetRevoked.bind(this));
        // Assignment due date events
        this.eventDispatcher.register('AssignmentDueDateChanged', this.handleAssignmentDueDateChanged.bind(this));
        this.eventDispatcher.register('AssignmentDueDateExtended', this.handleAssignmentDueDateExtended.bind(this));
        this.eventDispatcher.register('AssignmentOverdue', this.handleAssignmentOverdue.bind(this));
        this.logger.info('Assignment event handlers registered');
    }
    async handleAssignmentCreated(event) {
        try {
            this.logger.info('Handling AssignmentCreated event', {
                assignmentId: event.assignmentId,
                teacherId: event.teacherId
            });
            // Get full assignment details
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById({ toString: () => event.assignmentId });
            if (assignmentResult.isFailure) {
                this.logger.error('Failed to get assignment for created event', {
                    assignmentId: event.assignmentId,
                    error: assignmentResult.error
                });
                return;
            }
            const assignment = assignmentResult.value;
            // Send creation notification (only if assignment is already active)
            if (assignment.isActive()) {
                const notificationResult = await this.notificationService.notifyAssignmentCreated(assignment);
                if (notificationResult.isFailure) {
                    this.logger.error('Failed to send assignment created notification', {
                        assignmentId: event.assignmentId,
                        error: notificationResult.error
                    });
                }
            }
            // Invalidate relevant caches
            await this.invalidateCachesForAssignmentChange(event.assignmentId, event.teacherId);
        }
        catch (error) {
            this.logger.error('Error handling AssignmentCreated event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentActivated(event) {
        try {
            this.logger.info('Handling AssignmentActivated event', {
                assignmentId: event.assignmentId,
                teacherId: event.teacherId
            });
            // Get full assignment details
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById({ toString: () => event.assignmentId });
            if (assignmentResult.isFailure) {
                this.logger.error('Failed to get assignment for activated event', {
                    assignmentId: event.assignmentId,
                    error: assignmentResult.error
                });
                return;
            }
            const assignment = assignmentResult.value;
            // Send activation notification
            const notificationResult = await this.notificationService.notifyAssignmentCreated(assignment);
            if (notificationResult.isFailure) {
                this.logger.error('Failed to send assignment activation notification', {
                    assignmentId: event.assignmentId,
                    error: notificationResult.error
                });
            }
            // Invalidate relevant caches
            await this.invalidateCachesForAssignmentChange(event.assignmentId, event.teacherId);
        }
        catch (error) {
            this.logger.error('Error handling AssignmentActivated event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentTargetAdded(event) {
        try {
            this.logger.info('Handling AssignmentTargetAdded event', {
                assignmentId: event.assignmentId,
                targetType: event.targetType,
                targetId: event.targetId
            });
            // Invalidate caches for the assignment and affected targets
            await this.invalidateCachesForAssignmentChange(event.assignmentId);
            if (event.targetType === 'class') {
                await this.cachedAssignmentService.invalidateClassCache(event.targetId);
            }
            else {
                await this.cachedAssignmentService.invalidateStudentCache(event.targetId);
            }
            // Log assignment target addition for analytics
            this.logger.info('Assignment target added', {
                assignmentId: event.assignmentId,
                targetType: event.targetType,
                targetId: event.targetId,
                assignedBy: event.assignedBy
            });
        }
        catch (error) {
            this.logger.error('Error handling AssignmentTargetAdded event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentTargetRevoked(event) {
        try {
            this.logger.info('Handling AssignmentTargetRevoked event', {
                assignmentId: event.assignmentId,
                targetType: event.targetType,
                targetId: event.targetId
            });
            // Invalidate caches for the assignment and affected targets
            await this.invalidateCachesForAssignmentChange(event.assignmentId);
            if (event.targetType === 'class') {
                await this.cachedAssignmentService.invalidateClassCache(event.targetId);
            }
            else {
                await this.cachedAssignmentService.invalidateStudentCache(event.targetId);
            }
            // Log assignment target revocation for analytics
            this.logger.info('Assignment target revoked', {
                assignmentId: event.assignmentId,
                targetType: event.targetType,
                targetId: event.targetId,
                revokedBy: event.revokedBy
            });
        }
        catch (error) {
            this.logger.error('Error handling AssignmentTargetRevoked event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentDueDateChanged(event) {
        try {
            this.logger.info('Handling AssignmentDueDateChanged event', {
                assignmentId: event.assignmentId,
                oldDueDate: event.oldDueDate,
                newDueDate: event.newDueDate
            });
            // Get full assignment details
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById({ toString: () => event.assignmentId });
            if (assignmentResult.isFailure) {
                this.logger.error('Failed to get assignment for due date changed event', {
                    assignmentId: event.assignmentId,
                    error: assignmentResult.error
                });
                return;
            }
            const assignment = assignmentResult.value;
            // Send due date change notification
            const notificationResult = await this.notificationService.notifyAssignmentDueDateChanged(assignment, event.oldDueDate, 'changed');
            if (notificationResult.isFailure) {
                this.logger.error('Failed to send due date change notification', {
                    assignmentId: event.assignmentId,
                    error: notificationResult.error
                });
            }
            // Invalidate time-sensitive caches
            await this.invalidateCachesForDueDateChange(event.assignmentId, event.teacherId);
        }
        catch (error) {
            this.logger.error('Error handling AssignmentDueDateChanged event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentDueDateExtended(event) {
        try {
            this.logger.info('Handling AssignmentDueDateExtended event', {
                assignmentId: event.assignmentId,
                extensionHours: event.extensionHours,
                newDueDate: event.newDueDate
            });
            // Get full assignment details
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById({ toString: () => event.assignmentId });
            if (assignmentResult.isFailure) {
                this.logger.error('Failed to get assignment for due date extended event', {
                    assignmentId: event.assignmentId,
                    error: assignmentResult.error
                });
                return;
            }
            const assignment = assignmentResult.value;
            // Send due date extension notification
            const notificationResult = await this.notificationService.notifyAssignmentDueDateChanged(assignment, event.oldDueDate, 'extended');
            if (notificationResult.isFailure) {
                this.logger.error('Failed to send due date extension notification', {
                    assignmentId: event.assignmentId,
                    error: notificationResult.error
                });
            }
            // Invalidate time-sensitive caches
            await this.invalidateCachesForDueDateChange(event.assignmentId, event.teacherId);
        }
        catch (error) {
            this.logger.error('Error handling AssignmentDueDateExtended event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentOverdue(event) {
        try {
            this.logger.info('Handling AssignmentOverdue event', {
                assignmentId: event.assignmentId,
                dueDate: event.dueDate,
                detectedAt: event.detectedAt
            });
            // Get full assignment details
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById({ toString: () => event.assignmentId });
            if (assignmentResult.isFailure) {
                this.logger.error('Failed to get assignment for overdue event', {
                    assignmentId: event.assignmentId,
                    error: assignmentResult.error
                });
                return;
            }
            const assignment = assignmentResult.value;
            // Send overdue notification
            const notificationResult = await this.notificationService.notifyAssignmentOverdue(assignment);
            if (notificationResult.isFailure) {
                this.logger.error('Failed to send overdue notification', {
                    assignmentId: event.assignmentId,
                    error: notificationResult.error
                });
            }
            // Invalidate time-sensitive caches
            await this.invalidateCachesForDueDateChange(event.assignmentId, event.teacherId);
        }
        catch (error) {
            this.logger.error('Error handling AssignmentOverdue event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleAssignmentClosed(event) {
        try {
            this.logger.info('Handling AssignmentClosed event', {
                assignmentId: event.assignmentId,
                reason: event.reason,
                closedAt: event.closedAt
            });
            // Invalidate all related caches
            await this.invalidateCachesForAssignmentChange(event.assignmentId, event.teacherId);
            // Log assignment closure for analytics
            this.logger.info('Assignment closed', {
                assignmentId: event.assignmentId,
                teacherId: event.teacherId,
                reason: event.reason,
                closedAt: event.closedAt
            });
        }
        catch (error) {
            this.logger.error('Error handling AssignmentClosed event', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Helper methods for cache invalidation
    async invalidateCachesForAssignmentChange(assignmentId, teacherId) {
        try {
            await this.cachedAssignmentService.invalidateAssignmentCache(assignmentId);
            if (teacherId) {
                await this.cachedAssignmentService.invalidateTeacherCache(teacherId);
            }
        }
        catch (error) {
            this.logger.error('Error invalidating caches for assignment change', {
                assignmentId,
                teacherId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async invalidateCachesForDueDateChange(assignmentId, teacherId) {
        try {
            await this.cachedAssignmentService.invalidateAssignmentCache(assignmentId);
            if (teacherId) {
                await this.cachedAssignmentService.invalidateTeacherCache(teacherId);
            }
            // Also invalidate time-sensitive cache entries
            await this.cachedAssignmentService['cacheService'].deleteByPattern(`${this.cachedAssignmentService['CACHE_PREFIX']}due_soon:*`);
            await this.cachedAssignmentService['cacheService'].deleteByPattern(`${this.cachedAssignmentService['CACHE_PREFIX']}overdue:*`);
        }
        catch (error) {
            this.logger.error('Error invalidating caches for due date change', {
                assignmentId,
                teacherId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
//# sourceMappingURL=AssignmentEventHandlers.js.map