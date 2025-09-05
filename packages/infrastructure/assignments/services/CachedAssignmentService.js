import { Result } from '@woodie/domain';
export class CachedAssignmentService {
    assignmentService;
    cacheService;
    logger;
    config;
    CACHE_PREFIX = 'assignment:';
    defaultConfig = {
        assignmentTTL: 1800, // 30 minutes
        assignmentListTTL: 600, // 10 minutes  
        teacherAssignmentsTTL: 900, // 15 minutes
        studentAssignmentsTTL: 1200, // 20 minutes
        classAssignmentsTTL: 1200, // 20 minutes
        dueDateStatusTTL: 300 // 5 minutes
    };
    constructor(assignmentService, cacheService, logger, config = {}) {
        this.assignmentService = assignmentService;
        this.cacheService = cacheService;
        this.logger = logger;
        this.config = config;
        this.config = { ...this.defaultConfig, ...config };
    }
    // === 캐시된 과제 조회 메서드들 ===
    async getTeacherAssignmentsWithCache(teacherId) {
        const cacheKey = this.buildCacheKey('teacher', teacherId);
        try {
            // Try cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                this.logger.debug(`Cache hit for teacher assignments: ${teacherId}`);
                return Result.ok(this.deserializeAssignments(cachedResult));
            }
            // Cache miss - fetch from service
            this.logger.debug(`Cache miss for teacher assignments: ${teacherId}`);
            const serviceResult = await this.assignmentService.getTeacherAssignmentsDueDateStatus(teacherId);
            if (serviceResult.isFailure) {
                return Result.fail(serviceResult.error);
            }
            // Note: getTeacherAssignmentsDueDateStatus returns status array, not Assignment[]
            // We need to use the repository directly for this case
            // This is a design consideration - we might need to add a proper method to the service
            // For now, let's use a different approach
            const assignmentsResult = await this.assignmentService['assignmentRepository'].findByTeacherId(teacherId);
            if (assignmentsResult.isSuccess) {
                // Cache the result
                await this.cacheService.set(cacheKey, this.serializeAssignments(assignmentsResult.value), this.config.teacherAssignmentsTTL);
                this.logger.debug(`Cached teacher assignments: ${teacherId}`);
                return Result.ok(assignmentsResult.value);
            }
            return Result.fail(assignmentsResult.error);
        }
        catch (error) {
            this.logger.error('Error in getTeacherAssignmentsWithCache', { error, teacherId });
            // Fallback to service without cache
            const assignmentsResult = await this.assignmentService['assignmentRepository'].findByTeacherId(teacherId);
            return assignmentsResult;
        }
    }
    async getStudentAssignmentsWithCache(studentId) {
        const cacheKey = this.buildCacheKey('student', studentId);
        try {
            // Try cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                this.logger.debug(`Cache hit for student assignments: ${studentId}`);
                return Result.ok(this.deserializeAssignments(cachedResult));
            }
            // Cache miss - fetch from service
            this.logger.debug(`Cache miss for student assignments: ${studentId}`);
            const serviceResult = await this.assignmentService.getAccessibleAssignmentsForStudent(studentId);
            if (serviceResult.isSuccess) {
                // Cache the result
                await this.cacheService.set(cacheKey, this.serializeAssignments(serviceResult.value), this.config.studentAssignmentsTTL);
                this.logger.debug(`Cached student assignments: ${studentId}`);
            }
            return serviceResult;
        }
        catch (error) {
            this.logger.error('Error in getStudentAssignmentsWithCache', { error, studentId });
            // Fallback to service without cache
            return await this.assignmentService.getAccessibleAssignmentsForStudent(studentId);
        }
    }
    async getClassAssignmentsWithCache(classId) {
        const cacheKey = this.buildCacheKey('class', classId);
        try {
            // Try cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                this.logger.debug(`Cache hit for class assignments: ${classId}`);
                return Result.ok(this.deserializeAssignments(cachedResult));
            }
            // Cache miss - fetch from service
            this.logger.debug(`Cache miss for class assignments: ${classId}`);
            const serviceResult = await this.assignmentService.getAssignmentsForClass(classId);
            if (serviceResult.isSuccess) {
                // Cache the result
                await this.cacheService.set(cacheKey, this.serializeAssignments(serviceResult.value), this.config.classAssignmentsTTL);
                this.logger.debug(`Cached class assignments: ${classId}`);
            }
            return serviceResult;
        }
        catch (error) {
            this.logger.error('Error in getClassAssignmentsWithCache', { error, classId });
            // Fallback to service without cache
            return await this.assignmentService.getAssignmentsForClass(classId);
        }
    }
    async getDueSoonAssignmentsWithCache(hoursThreshold = 24) {
        const cacheKey = this.buildCacheKey('due_soon', hoursThreshold.toString());
        try {
            // Try cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                this.logger.debug(`Cache hit for due soon assignments: ${hoursThreshold}h`);
                return Result.ok(this.deserializeAssignments(cachedResult));
            }
            // Cache miss - fetch from service
            this.logger.debug(`Cache miss for due soon assignments: ${hoursThreshold}h`);
            const serviceResult = await this.assignmentService.getAssignmentsDueSoon(hoursThreshold);
            if (serviceResult.isSuccess) {
                // Cache with shorter TTL since this is time-sensitive
                await this.cacheService.set(cacheKey, this.serializeAssignments(serviceResult.value), this.config.dueDateStatusTTL);
                this.logger.debug(`Cached due soon assignments: ${hoursThreshold}h`);
            }
            return serviceResult;
        }
        catch (error) {
            this.logger.error('Error in getDueSoonAssignmentsWithCache', { error, hoursThreshold });
            // Fallback to service without cache
            return await this.assignmentService.getAssignmentsDueSoon(hoursThreshold);
        }
    }
    async getOverdueAssignmentsWithCache() {
        const cacheKey = this.buildCacheKey('overdue', 'all');
        try {
            // Try cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                this.logger.debug('Cache hit for overdue assignments');
                return Result.ok(this.deserializeAssignments(cachedResult));
            }
            // Cache miss - fetch from service
            this.logger.debug('Cache miss for overdue assignments');
            const serviceResult = await this.assignmentService.getOverdueAssignments();
            if (serviceResult.isSuccess) {
                // Cache with shorter TTL since this is time-sensitive
                await this.cacheService.set(cacheKey, this.serializeAssignments(serviceResult.value), this.config.dueDateStatusTTL);
                this.logger.debug('Cached overdue assignments');
            }
            return serviceResult;
        }
        catch (error) {
            this.logger.error('Error in getOverdueAssignmentsWithCache', { error });
            // Fallback to service without cache
            return await this.assignmentService.getOverdueAssignments();
        }
    }
    // === 캐시 무효화 메서드들 ===
    async invalidateAssignmentCache(assignmentId) {
        try {
            const patterns = [
                this.buildCacheKey('assignment', assignmentId),
                this.buildCacheKey('teacher', '*'),
                this.buildCacheKey('student', '*'),
                this.buildCacheKey('class', '*'),
                this.buildCacheKey('due_soon', '*'),
                this.buildCacheKey('overdue', '*')
            ];
            for (const pattern of patterns) {
                if (pattern.includes('*')) {
                    await this.cacheService.deleteByPattern(pattern);
                }
                else {
                    await this.cacheService.delete(pattern);
                }
            }
            this.logger.debug(`Invalidated cache for assignment: ${assignmentId}`);
        }
        catch (error) {
            this.logger.error('Error invalidating assignment cache', { error, assignmentId });
        }
    }
    async invalidateTeacherCache(teacherId) {
        try {
            const cacheKey = this.buildCacheKey('teacher', teacherId);
            await this.cacheService.delete(cacheKey);
            this.logger.debug(`Invalidated teacher cache: ${teacherId}`);
        }
        catch (error) {
            this.logger.error('Error invalidating teacher cache', { error, teacherId });
        }
    }
    async invalidateStudentCache(studentId) {
        try {
            const cacheKey = this.buildCacheKey('student', studentId);
            await this.cacheService.delete(cacheKey);
            this.logger.debug(`Invalidated student cache: ${studentId}`);
        }
        catch (error) {
            this.logger.error('Error invalidating student cache', { error, studentId });
        }
    }
    async invalidateClassCache(classId) {
        try {
            const cacheKey = this.buildCacheKey('class', classId);
            await this.cacheService.delete(cacheKey);
            this.logger.debug(`Invalidated class cache: ${classId}`);
        }
        catch (error) {
            this.logger.error('Error invalidating class cache', { error, classId });
        }
    }
    async invalidateAllAssignmentCaches() {
        try {
            const pattern = `${this.CACHE_PREFIX}*`;
            await this.cacheService.deleteByPattern(pattern);
            this.logger.debug('Invalidated all assignment caches');
        }
        catch (error) {
            this.logger.error('Error invalidating all assignment caches', { error });
        }
    }
    // === 헬퍼 메서드들 ===
    buildCacheKey(type, identifier) {
        return `${this.CACHE_PREFIX}${type}:${identifier}`;
    }
    serializeAssignments(assignments) {
        try {
            // Convert assignments to persistence format for caching
            const serialized = assignments.map(assignment => assignment.toPersistence());
            return JSON.stringify(serialized);
        }
        catch (error) {
            this.logger.error('Error serializing assignments', { error });
            throw error;
        }
    }
    deserializeAssignments(cached) {
        try {
            const parsed = JSON.parse(cached);
            // Note: This would require Assignment.fromPersistence() method
            // For now, this is a placeholder - actual implementation would need
            // the Assignment entity to support deserialization from persistence format
            this.logger.warn('Assignment deserialization not fully implemented');
            return [];
        }
        catch (error) {
            this.logger.error('Error deserializing assignments', { error });
            throw error;
        }
    }
    // === 통계 및 모니터링 ===
    async getCacheStats() {
        // This would require the cache service to support stats
        // Implementation depends on the specific cache service
        return {
            hitRate: 0,
            totalRequests: 0,
            cacheSize: 0
        };
    }
}
//# sourceMappingURL=CachedAssignmentService.js.map