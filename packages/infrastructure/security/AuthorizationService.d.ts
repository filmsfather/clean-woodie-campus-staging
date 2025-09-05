import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface User {
    id: string;
    email: string;
    role: 'teacher' | 'student' | 'admin';
    organizationId?: string;
    schoolId?: string;
    grade?: number;
    permissions: Permission[];
    isActive: boolean;
    lastLoginAt?: Date;
}
export interface Permission {
    resource: string;
    action: string;
    conditions?: Record<string, any>;
}
export interface AuthContext {
    user: User;
    sessionId: string;
    requestId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}
export interface AccessControlRule {
    resource: string;
    action: string;
    role: string[];
    condition?: (context: AuthContext, resource: any) => boolean;
    priority: number;
}
export interface SecurityPolicy {
    name: string;
    description: string;
    rules: AccessControlRule[];
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
}
export declare class AuthorizationService {
    private readonly logger;
    private readonly policies;
    private readonly roleHierarchy;
    constructor(logger: ILogger);
    authorize(context: AuthContext, resource: string, action: string, resourceData?: any): Promise<Result<boolean>>;
    authorizeTeacherAccess(context: AuthContext, resourceOwnerId: string, action: string): Promise<Result<boolean>>;
    authorizeStudentAccess(context: AuthContext, problemId: string, action: string): Promise<Result<boolean>>;
    checkDataAccess(context: AuthContext, dataType: string, dataOwnerId: string, action: string): Promise<Result<boolean>>;
    addAccessControlRule(policyName: string, rule: AccessControlRule): void;
    updateSecurityPolicy(policyName: string, policy: Partial<SecurityPolicy>): void;
    getAuditLog(userId?: string, resource?: string, fromDate?: Date, toDate?: Date): Promise<Array<{
        userId: string;
        action: string;
        resource: string;
        result: 'granted' | 'denied';
        reason: string;
        timestamp: Date;
        context: Partial<AuthContext>;
    }>>;
    private checkPolicies;
    private checkRolePermissions;
    private checkResourceAccess;
    private checkProblemAccess;
    private checkProblemSetAccess;
    private checkStudentAnswerAccess;
    private checkDefaultRolePermissions;
    private allowAccess;
    private denyAccess;
    private isSameOrganization;
    private isProblemActiveForStudent;
    private isTeacherResourceOwner;
    private isProblemOwnedByTeacher;
    private initializeDefaultPolicies;
    private initializeRoleHierarchy;
}
//# sourceMappingURL=AuthorizationService.d.ts.map