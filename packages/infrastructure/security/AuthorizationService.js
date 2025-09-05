import { Result } from '@woodie/domain/common/Result';
export class AuthorizationService {
    logger;
    policies = new Map();
    roleHierarchy = new Map();
    constructor(logger) {
        this.logger = logger;
        this.initializeDefaultPolicies();
        this.initializeRoleHierarchy();
    }
    // 권한 확인 메인 메서드
    async authorize(context, resource, action, resourceData) {
        try {
            this.logger.debug('Authorization check started', {
                userId: context.user.id,
                userRole: context.user.role,
                resource,
                action,
                sessionId: context.sessionId
            });
            // 사용자 활성 상태 확인
            if (!context.user.isActive) {
                return this.denyAccess('User account is inactive', context, resource, action);
            }
            // 관리자는 모든 권한 허용
            if (context.user.role === 'admin') {
                return this.allowAccess('Admin role has full access', context, resource, action);
            }
            // 정책 기반 권한 확인
            const policyResult = await this.checkPolicies(context, resource, action, resourceData);
            if (policyResult.isFailure) {
                return policyResult;
            }
            // 역할별 권한 확인
            const roleResult = await this.checkRolePermissions(context, resource, action);
            if (roleResult.isFailure) {
                return roleResult;
            }
            // 리소스별 세부 권한 확인
            const resourceResult = await this.checkResourceAccess(context, resource, action, resourceData);
            if (resourceResult.isFailure) {
                return resourceResult;
            }
            return this.allowAccess('Access granted', context, resource, action);
        }
        catch (error) {
            this.logger.error('Authorization check failed', {
                error: error instanceof Error ? error.message : String(error),
                userId: context.user.id,
                resource,
                action
            });
            return Result.fail('Authorization check failed');
        }
    }
    // 교사 권한 검증 (특화 메서드)
    async authorizeTeacherAccess(context, resourceOwnerId, action) {
        if (context.user.role !== 'teacher') {
            return this.denyAccess('User is not a teacher', context, 'teacher_resource', action);
        }
        // 자신의 리소스에만 접근 가능
        if (context.user.id !== resourceOwnerId) {
            // 같은 조직/학교 내에서는 읽기 권한 허용 (정책에 따라)
            if (action === 'read' &&
                context.user.organizationId &&
                await this.isSameOrganization(context.user.id, resourceOwnerId)) {
                return this.allowAccess('Same organization read access', context, 'teacher_resource', action);
            }
            return this.denyAccess('Access denied: not resource owner', context, 'teacher_resource', action);
        }
        return this.allowAccess('Teacher access to own resource', context, 'teacher_resource', action);
    }
    // 학생 권한 검증 (특화 메서드)
    async authorizeStudentAccess(context, problemId, action) {
        if (context.user.role !== 'student') {
            return this.denyAccess('User is not a student', context, 'student_access', action);
        }
        // 활성 문제만 접근 가능
        if (action === 'solve' || action === 'view') {
            const isProblemActive = await this.isProblemActiveForStudent(problemId, context.user.id);
            if (!isProblemActive) {
                return this.denyAccess('Problem not available for student', context, 'problem', action);
            }
        }
        // 답안 조회는 자신의 것만
        if (action === 'view_answer') {
            return this.allowAccess('Student can view own answers', context, 'student_answer', action);
        }
        return this.allowAccess('Student access granted', context, 'student_access', action);
    }
    // 데이터 접근 정책 확인
    async checkDataAccess(context, dataType, dataOwnerId, action) {
        // 개인 데이터 보호
        if (dataType === 'personal_data' && context.user.id !== dataOwnerId) {
            if (context.user.role === 'admin') {
                return this.allowAccess('Admin access to personal data', context, dataType, action);
            }
            return this.denyAccess('Access denied to personal data', context, dataType, action);
        }
        // 교육 데이터 접근
        if (dataType === 'educational_data') {
            if (context.user.role === 'teacher') {
                // 교사는 자신이 생성한 문제 관련 데이터에만 접근
                if (await this.isTeacherResourceOwner(context.user.id, dataOwnerId)) {
                    return this.allowAccess('Teacher access to educational data', context, dataType, action);
                }
            }
            if (context.user.role === 'student' && context.user.id === dataOwnerId) {
                return this.allowAccess('Student access to own educational data', context, dataType, action);
            }
        }
        return Result.ok(false);
    }
    // 리소스별 접근 제어 규칙 추가
    addAccessControlRule(policyName, rule) {
        const policy = this.policies.get(policyName);
        if (policy) {
            policy.rules.push(rule);
            policy.rules.sort((a, b) => b.priority - a.priority); // 우선순위 정렬
        }
        this.logger.info('Access control rule added', {
            policyName,
            resource: rule.resource,
            action: rule.action,
            roles: rule.role
        });
    }
    // 보안 정책 업데이트
    updateSecurityPolicy(policyName, policy) {
        const existingPolicy = this.policies.get(policyName);
        if (existingPolicy) {
            Object.assign(existingPolicy, policy);
            this.logger.info('Security policy updated', { policyName });
        }
    }
    // 권한 감사 로그
    getAuditLog(userId, resource, fromDate, toDate) {
        // 실제 구현에서는 데이터베이스나 로그 시스템에서 조회
        this.logger.info('Audit log requested', {
            userId,
            resource,
            fromDate,
            toDate
        });
        return Promise.resolve([]);
    }
    async checkPolicies(context, resource, action, resourceData) {
        for (const policy of this.policies.values()) {
            if (!policy.isActive)
                continue;
            for (const rule of policy.rules) {
                if (rule.resource === resource && rule.action === action) {
                    if (rule.role.includes(context.user.role)) {
                        if (rule.condition) {
                            const conditionMet = rule.condition(context, resourceData);
                            if (!conditionMet) {
                                return this.denyAccess(`Policy condition not met: ${policy.name}`, context, resource, action);
                            }
                        }
                        return Result.ok(true);
                    }
                }
            }
        }
        return Result.ok(false);
    }
    async checkRolePermissions(context, resource, action) {
        // 역할 계층 구조 확인
        const allowedRoles = this.roleHierarchy.get(context.user.role) || [context.user.role];
        // 사용자의 명시적 권한 확인
        const hasPermission = context.user.permissions.some(permission => permission.resource === resource && permission.action === action);
        if (hasPermission) {
            return Result.ok(true);
        }
        // 역할 기반 기본 권한 확인
        return this.checkDefaultRolePermissions(context.user.role, resource, action);
    }
    async checkResourceAccess(context, resource, action, resourceData) {
        switch (resource) {
            case 'problem':
                return this.checkProblemAccess(context, action, resourceData);
            case 'problem_set':
                return this.checkProblemSetAccess(context, action, resourceData);
            case 'student_answer':
                return this.checkStudentAnswerAccess(context, action, resourceData);
            default:
                return Result.ok(true);
        }
    }
    async checkProblemAccess(context, action, problemData) {
        if (!problemData) {
            return Result.ok(true);
        }
        // 교사는 자신의 문제만 수정 가능
        if (context.user.role === 'teacher' && ['update', 'delete'].includes(action)) {
            if (problemData.teacherId !== context.user.id) {
                return this.denyAccess('Teacher can only modify own problems', context, 'problem', action);
            }
        }
        // 학생은 활성화된 문제만 조회 가능
        if (context.user.role === 'student' && action === 'read') {
            if (!problemData.isActive) {
                return this.denyAccess('Problem is not active for students', context, 'problem', action);
            }
        }
        return Result.ok(true);
    }
    async checkProblemSetAccess(context, action, problemSetData) {
        if (!problemSetData) {
            return Result.ok(true);
        }
        // 교사는 자신의 문제집만 관리 가능
        if (context.user.role === 'teacher' && ['update', 'delete', 'assign'].includes(action)) {
            if (problemSetData.teacherId !== context.user.id) {
                return this.denyAccess('Teacher can only manage own problem sets', context, 'problem_set', action);
            }
        }
        return Result.ok(true);
    }
    async checkStudentAnswerAccess(context, action, answerData) {
        if (!answerData) {
            return Result.ok(true);
        }
        // 학생은 자신의 답안만 조회 가능
        if (context.user.role === 'student' && action === 'read') {
            if (answerData.studentId !== context.user.id) {
                return this.denyAccess('Student can only view own answers', context, 'student_answer', action);
            }
        }
        // 교사는 자신 문제의 답안만 조회 가능
        if (context.user.role === 'teacher' && action === 'read') {
            const isTeacherProblem = await this.isProblemOwnedByTeacher(answerData.problemId, context.user.id);
            if (!isTeacherProblem) {
                return this.denyAccess('Teacher can only view answers to own problems', context, 'student_answer', action);
            }
        }
        return Result.ok(true);
    }
    checkDefaultRolePermissions(role, resource, action) {
        const defaultPermissions = {
            teacher: {
                problem: ['create', 'read', 'update', 'delete'],
                problem_set: ['create', 'read', 'update', 'delete', 'assign'],
                student_answer: ['read', 'grade']
            },
            student: {
                problem: ['read'],
                problem_set: ['read'],
                student_answer: ['create', 'read']
            }
        };
        const rolePermissions = defaultPermissions[role];
        if (rolePermissions && rolePermissions[resource]) {
            const allowed = rolePermissions[resource].includes(action);
            return Promise.resolve(Result.ok(allowed));
        }
        return Promise.resolve(Result.ok(false));
    }
    allowAccess(reason, context, resource, action) {
        this.logger.info('Access granted', {
            userId: context.user.id,
            userRole: context.user.role,
            resource,
            action,
            reason,
            sessionId: context.sessionId
        });
        return Result.ok(true);
    }
    denyAccess(reason, context, resource, action) {
        this.logger.warn('Access denied', {
            userId: context.user.id,
            userRole: context.user.role,
            resource,
            action,
            reason,
            sessionId: context.sessionId,
            ipAddress: context.ipAddress
        });
        return Result.fail(reason);
    }
    async isSameOrganization(userId1, userId2) {
        // 실제 구현에서는 데이터베이스에서 조회
        return false;
    }
    async isProblemActiveForStudent(problemId, studentId) {
        // 실제 구현에서는 데이터베이스에서 문제 상태 확인
        return true;
    }
    async isTeacherResourceOwner(teacherId, resourceOwnerId) {
        return teacherId === resourceOwnerId;
    }
    async isProblemOwnedByTeacher(problemId, teacherId) {
        // 실제 구현에서는 데이터베이스에서 확인
        return true;
    }
    initializeDefaultPolicies() {
        // 기본 보안 정책
        const defaultPolicy = {
            name: 'default',
            description: 'Default security policy for education platform',
            isActive: true,
            createdBy: 'system',
            createdAt: new Date(),
            rules: [
                {
                    resource: 'problem',
                    action: 'create',
                    role: ['teacher'],
                    priority: 100
                },
                {
                    resource: 'problem',
                    action: 'read',
                    role: ['teacher', 'student'],
                    priority: 90
                },
                {
                    resource: 'problem_set',
                    action: 'assign',
                    role: ['teacher'],
                    condition: (context, resource) => {
                        return resource && resource.teacherId === context.user.id;
                    },
                    priority: 95
                }
            ]
        };
        this.policies.set('default', defaultPolicy);
    }
    initializeRoleHierarchy() {
        this.roleHierarchy.set('admin', ['admin', 'teacher', 'student']);
        this.roleHierarchy.set('teacher', ['teacher']);
        this.roleHierarchy.set('student', ['student']);
    }
}
//# sourceMappingURL=AuthorizationService.js.map