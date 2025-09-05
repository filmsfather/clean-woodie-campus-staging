import { AssignmentService, Assignment, Result } from '@woodie/domain';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { ILogger } from '../../common/interfaces/ILogger';
export interface CacheConfig {
    assignmentTTL: number;
    assignmentListTTL: number;
    teacherAssignmentsTTL: number;
    studentAssignmentsTTL: number;
    classAssignmentsTTL: number;
    dueDateStatusTTL: number;
}
export declare class CachedAssignmentService {
    private assignmentService;
    private cacheService;
    private logger;
    private config;
    private readonly CACHE_PREFIX;
    private readonly defaultConfig;
    constructor(assignmentService: AssignmentService, cacheService: ICacheService, logger: ILogger, config?: CacheConfig);
    getTeacherAssignmentsWithCache(teacherId: string): Promise<Result<Assignment[]>>;
    getStudentAssignmentsWithCache(studentId: string): Promise<Result<Assignment[]>>;
    getClassAssignmentsWithCache(classId: string): Promise<Result<Assignment[]>>;
    getDueSoonAssignmentsWithCache(hoursThreshold?: number): Promise<Result<Assignment[]>>;
    getOverdueAssignmentsWithCache(): Promise<Result<Assignment[]>>;
    invalidateAssignmentCache(assignmentId: string): Promise<void>;
    invalidateTeacherCache(teacherId: string): Promise<void>;
    invalidateStudentCache(studentId: string): Promise<void>;
    invalidateClassCache(classId: string): Promise<void>;
    invalidateAllAssignmentCaches(): Promise<void>;
    private buildCacheKey;
    private serializeAssignments;
    private deserializeAssignments;
    getCacheStats(): Promise<{
        hitRate: number;
        totalRequests: number;
        cacheSize: number;
    }>;
}
//# sourceMappingURL=CachedAssignmentService.d.ts.map