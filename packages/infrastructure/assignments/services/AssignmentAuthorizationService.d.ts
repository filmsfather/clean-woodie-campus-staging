import { SupabaseClient } from '@supabase/supabase-js';
import { Result } from '@woodie/domain';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { ILogger } from '../../common/interfaces/ILogger';
export interface UserRole {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    schoolId?: string;
    classId?: string;
    isActive: boolean;
}
export interface ClassMembership {
    classId: string;
    studentId: string;
    teacherId: string;
    schoolId: string;
    isActive: boolean;
}
export interface AuthorizationContext {
    userId: string;
    userRole: UserRole;
    requestedResource: 'assignment' | 'class' | 'student';
    resourceId: string;
    operation: 'create' | 'read' | 'update' | 'delete' | 'assign' | 'revoke';
}
export interface AuthorizationResult {
    isAuthorized: boolean;
    reason?: string;
    permissions?: string[];
}
export declare class AssignmentAuthorizationService {
    private supabase;
    private logger;
    private cache?;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(supabase: SupabaseClient, logger: ILogger, cache?: ICacheService | undefined);
    authorizeAssignmentOperation(context: AuthorizationContext): Promise<Result<AuthorizationResult>>;
    canTeacherAccessAssignment(teacherId: string, assignmentId: string): Promise<Result<boolean>>;
    canStudentAccessAssignment(studentId: string, assignmentId: string): Promise<Result<boolean>>;
    canTeacherAssignToClass(teacherId: string, classId: string): Promise<Result<boolean>>;
    canTeacherAssignToStudent(teacherId: string, studentId: string): Promise<Result<boolean>>;
    getStudentClassMemberships(studentId: string): Promise<Result<ClassMembership[]>>;
    private performAuthorizationCheck;
    private checkCreatePermission;
    private checkReadPermission;
    private checkUpdatePermission;
    private checkDeletePermission;
    private checkAssignPermission;
    private checkRevokePermission;
    private checkOwnershipPermission;
    private getUserRole;
    private getStudentClass;
    private getClassDetails;
    private buildCacheKey;
    private getCachedResult;
    private cacheResult;
    invalidateUserCache(userId: string): Promise<void>;
    invalidateAssignmentCache(assignmentId: string): Promise<void>;
}
//# sourceMappingURL=AssignmentAuthorizationService.d.ts.map