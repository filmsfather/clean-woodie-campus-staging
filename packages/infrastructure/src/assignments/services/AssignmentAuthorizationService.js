import { Result } from '@woodie/domain';
export class AssignmentAuthorizationService {
    supabase;
    logger;
    cache;
    CACHE_PREFIX = 'auth:assignment:';
    CACHE_TTL = 1800; // 30 minutes
    constructor(supabase, logger, cache) {
        this.supabase = supabase;
        this.logger = logger;
        this.cache = cache;
    }
    async authorizeAssignmentOperation(context) {
        try {
            this.logger.debug('Authorizing assignment operation', { context });
            // Check cache first
            const cacheKey = this.buildCacheKey('operation', context);
            const cachedResult = await this.getCachedResult(cacheKey);
            if (cachedResult) {
                this.logger.debug('Authorization cache hit', { context });
                return Result.ok(cachedResult);
            }
            // Perform authorization check
            const authResult = await this.performAuthorizationCheck(context);
            if (authResult.isSuccess) {
                // Cache the result
                await this.cacheResult(cacheKey, authResult.value);
            }
            return authResult;
        }
        catch (error) {
            this.logger.error('Error in authorization check', {
                context,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return Result.fail(`Authorization check failed: ${error}`);
        }
    }
    async canTeacherAccessAssignment(teacherId, assignmentId) {
        try {
            const context = {
                userId: teacherId,
                userRole: await this.getUserRole(teacherId),
                requestedResource: 'assignment',
                resourceId: assignmentId,
                operation: 'read'
            };
            const authResult = await this.authorizeAssignmentOperation(context);
            if (authResult.isFailure) {
                return Result.fail(authResult.error);
            }
            return Result.ok(authResult.value.isAuthorized);
        }
        catch (error) {
            return Result.fail(`Failed to check teacher assignment access: ${error}`);
        }
    }
    async canStudentAccessAssignment(studentId, assignmentId) {
        try {
            // Get assignment details to check if student is assigned
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('learning.assignments')
                .select(`
          id,
          teacher_id,
          assignment_targets!inner (
            target_type,
            target_id,
            is_active
          )
        `)
                .eq('id', assignmentId)
                .single();
            if (assignmentError) {
                return Result.fail(`Failed to get assignment: ${assignmentError.message}`);
            }
            if (!assignment) {
                return Result.ok(false);
            }
            // Check if student is directly assigned
            const directAssignment = assignment.assignment_targets.find((target) => target.target_type === 'student' &&
                target.target_id === studentId &&
                target.is_active);
            if (directAssignment) {
                return Result.ok(true);
            }
            // Check if student is in an assigned class
            const studentClassResult = await this.getStudentClass(studentId);
            if (studentClassResult.isFailure) {
                return Result.fail(studentClassResult.error);
            }
            const studentClass = studentClassResult.value;
            if (!studentClass) {
                return Result.ok(false);
            }
            const classAssignment = assignment.assignment_targets.find((target) => target.target_type === 'class' &&
                target.target_id === studentClass.classId &&
                target.is_active);
            return Result.ok(!!classAssignment);
        }
        catch (error) {
            return Result.fail(`Failed to check student assignment access: ${error}`);
        }
    }
    async canTeacherAssignToClass(teacherId, classId) {
        try {
            const cacheKey = this.buildCacheKey('teacher_class', `${teacherId}:${classId}`);
            const cachedResult = await this.getCachedResult(cacheKey);
            if (cachedResult) {
                return Result.ok(cachedResult.isAuthorized);
            }
            // Get teacher's role and school
            const teacherRole = await this.getUserRole(teacherId);
            // Admin can assign to any class in their school
            if (teacherRole.role === 'admin') {
                const result = { isAuthorized: true, reason: 'Admin access' };
                await this.cacheResult(cacheKey, result);
                return Result.ok(true);
            }
            // Teacher can only assign to classes in their school
            if (teacherRole.role === 'teacher') {
                const classResult = await this.getClassDetails(classId);
                if (classResult.isFailure) {
                    return Result.fail(classResult.error);
                }
                const classDetails = classResult.value;
                const canAssign = teacherRole.schoolId === classDetails.schoolId;
                const result = {
                    isAuthorized: canAssign,
                    reason: canAssign ? 'Same school' : 'Different school'
                };
                await this.cacheResult(cacheKey, result);
                return Result.ok(canAssign);
            }
            return Result.ok(false);
        }
        catch (error) {
            return Result.fail(`Failed to check class assignment permission: ${error}`);
        }
    }
    async canTeacherAssignToStudent(teacherId, studentId) {
        try {
            const cacheKey = this.buildCacheKey('teacher_student', `${teacherId}:${studentId}`);
            const cachedResult = await this.getCachedResult(cacheKey);
            if (cachedResult) {
                return Result.ok(cachedResult.isAuthorized);
            }
            // Get both teacher and student roles
            const teacherRole = await this.getUserRole(teacherId);
            const studentRole = await this.getUserRole(studentId);
            // Admin can assign to any student in their school
            if (teacherRole.role === 'admin') {
                const canAssign = teacherRole.schoolId === studentRole.schoolId;
                const result = {
                    isAuthorized: canAssign,
                    reason: canAssign ? 'Admin same school' : 'Admin different school'
                };
                await this.cacheResult(cacheKey, result);
                return Result.ok(canAssign);
            }
            // Teacher can only assign to students in their school
            if (teacherRole.role === 'teacher') {
                const canAssign = teacherRole.schoolId === studentRole.schoolId;
                const result = {
                    isAuthorized: canAssign,
                    reason: canAssign ? 'Same school' : 'Different school'
                };
                await this.cacheResult(cacheKey, result);
                return Result.ok(canAssign);
            }
            return Result.ok(false);
        }
        catch (error) {
            return Result.fail(`Failed to check student assignment permission: ${error}`);
        }
    }
    async getStudentClassMemberships(studentId) {
        try {
            const cacheKey = this.buildCacheKey('student_classes', studentId);
            const cached = await this.cache?.get(cacheKey);
            if (cached) {
                return Result.ok(JSON.parse(cached));
            }
            const { data: memberships, error } = await this.supabase
                .from('auth.profiles')
                .select(`
          class_id,
          school_id,
          auth_classes!inner (
            id,
            teacher_id,
            is_active
          )
        `)
                .eq('id', studentId)
                .eq('role', 'student')
                .eq('is_active', true);
            if (error) {
                return Result.fail(`Failed to get student class memberships: ${error.message}`);
            }
            const classMemberships = (memberships || []).map((membership) => ({
                classId: membership.class_id,
                studentId,
                teacherId: membership.auth_classes.teacher_id,
                schoolId: membership.school_id,
                isActive: membership.auth_classes.is_active
            }));
            // Cache the result
            await this.cache?.set(cacheKey, JSON.stringify(classMemberships), this.CACHE_TTL);
            return Result.ok(classMemberships);
        }
        catch (error) {
            return Result.fail(`Failed to get student class memberships: ${error}`);
        }
    }
    // Private helper methods
    async performAuthorizationCheck(context) {
        switch (context.operation) {
            case 'create':
                return await this.checkCreatePermission(context);
            case 'read':
                return await this.checkReadPermission(context);
            case 'update':
                return await this.checkUpdatePermission(context);
            case 'delete':
                return await this.checkDeletePermission(context);
            case 'assign':
                return await this.checkAssignPermission(context);
            case 'revoke':
                return await this.checkRevokePermission(context);
            default:
                return Result.fail(`Unsupported operation: ${context.operation}`);
        }
    }
    async checkCreatePermission(context) {
        // Only teachers and admins can create assignments
        if (context.userRole.role === 'teacher' || context.userRole.role === 'admin') {
            return Result.ok({
                isAuthorized: true,
                reason: 'Teacher/Admin create permission',
                permissions: ['create_assignment']
            });
        }
        return Result.ok({
            isAuthorized: false,
            reason: 'Insufficient role for create operation'
        });
    }
    async checkReadPermission(context) {
        switch (context.userRole.role) {
            case 'admin':
                // Admin can read any assignment in their school
                return Result.ok({
                    isAuthorized: true,
                    reason: 'Admin read permission'
                });
            case 'teacher':
                // Teacher can read their own assignments and assignments in their school
                const teacherAccessResult = await this.canTeacherAccessAssignment(context.userId, context.resourceId);
                if (teacherAccessResult.isFailure) {
                    return Result.fail(teacherAccessResult.error);
                }
                return Result.ok({
                    isAuthorized: teacherAccessResult.value,
                    reason: teacherAccessResult.value ? 'Teacher owns assignment' : 'Teacher does not own assignment'
                });
            case 'student':
                // Student can only read assignments they're assigned to
                const studentAccessResult = await this.canStudentAccessAssignment(context.userId, context.resourceId);
                if (studentAccessResult.isFailure) {
                    return Result.fail(studentAccessResult.error);
                }
                return Result.ok({
                    isAuthorized: studentAccessResult.value,
                    reason: studentAccessResult.value ? 'Student is assigned' : 'Student is not assigned'
                });
            default:
                return Result.ok({
                    isAuthorized: false,
                    reason: 'Unknown role'
                });
        }
    }
    async checkUpdatePermission(context) {
        // Only assignment owners can update
        return await this.checkOwnershipPermission(context, 'update');
    }
    async checkDeletePermission(context) {
        // Only assignment owners can delete
        return await this.checkOwnershipPermission(context, 'delete');
    }
    async checkAssignPermission(context) {
        // Only assignment owners can assign
        return await this.checkOwnershipPermission(context, 'assign');
    }
    async checkRevokePermission(context) {
        // Only assignment owners can revoke
        return await this.checkOwnershipPermission(context, 'revoke');
    }
    async checkOwnershipPermission(context, operation) {
        if (context.userRole.role === 'student') {
            return Result.ok({
                isAuthorized: false,
                reason: `Students cannot perform ${operation} operation`
            });
        }
        // Check if user owns the assignment
        const { data: assignment, error } = await this.supabase
            .from('learning.assignments')
            .select('teacher_id')
            .eq('id', context.resourceId)
            .single();
        if (error) {
            return Result.fail(`Failed to check assignment ownership: ${error.message}`);
        }
        if (!assignment) {
            return Result.ok({
                isAuthorized: false,
                reason: 'Assignment not found'
            });
        }
        const isOwner = assignment.teacher_id === context.userId;
        return Result.ok({
            isAuthorized: isOwner,
            reason: isOwner ? `User owns assignment` : `User does not own assignment`
        });
    }
    async getUserRole(userId) {
        const cacheKey = this.buildCacheKey('user_role', userId);
        const cached = await this.cache?.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const { data: user, error } = await this.supabase
            .from('auth.profiles')
            .select('id, email, role, school_id, class_id, is_active')
            .eq('id', userId)
            .single();
        if (error) {
            throw new Error(`Failed to get user role: ${error.message}`);
        }
        const userRole = {
            id: user.id,
            email: user.email,
            role: user.role,
            schoolId: user.school_id,
            classId: user.class_id,
            isActive: user.is_active
        };
        // Cache the result
        await this.cache?.set(cacheKey, JSON.stringify(userRole), this.CACHE_TTL);
        return userRole;
    }
    async getStudentClass(studentId) {
        const { data: student, error } = await this.supabase
            .from('auth.profiles')
            .select('class_id, school_id')
            .eq('id', studentId)
            .eq('role', 'student')
            .eq('is_active', true)
            .single();
        if (error && error.code !== 'PGRST116') {
            return Result.fail(`Failed to get student class: ${error.message}`);
        }
        if (!student || !student.class_id) {
            return Result.ok(null);
        }
        return Result.ok({
            classId: student.class_id,
            schoolId: student.school_id
        });
    }
    async getClassDetails(classId) {
        const { data: classDetails, error } = await this.supabase
            .from('auth.classes')
            .select('school_id, teacher_id')
            .eq('id', classId)
            .eq('is_active', true)
            .single();
        if (error) {
            return Result.fail(`Failed to get class details: ${error.message}`);
        }
        return Result.ok({
            schoolId: classDetails.school_id,
            teacherId: classDetails.teacher_id
        });
    }
    // Cache helper methods
    buildCacheKey(type, identifier) {
        if (typeof identifier === 'string') {
            return `${this.CACHE_PREFIX}${type}:${identifier}`;
        }
        const context = identifier;
        return `${this.CACHE_PREFIX}${type}:${context.userId}:${context.resourceId}:${context.operation}`;
    }
    async getCachedResult(cacheKey) {
        if (!this.cache)
            return null;
        try {
            const cached = await this.cache.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            this.logger.error('Error getting cached authorization result', { cacheKey, error });
            return null;
        }
    }
    async cacheResult(cacheKey, result) {
        if (!this.cache)
            return;
        try {
            await this.cache.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
        }
        catch (error) {
            this.logger.error('Error caching authorization result', { cacheKey, result, error });
        }
    }
    // Cache invalidation methods
    async invalidateUserCache(userId) {
        if (!this.cache)
            return;
        try {
            const pattern = `${this.CACHE_PREFIX}*:${userId}:*`;
            await this.cache.deleteByPattern(pattern);
            const userRoleKey = this.buildCacheKey('user_role', userId);
            await this.cache.delete(userRoleKey);
        }
        catch (error) {
            this.logger.error('Error invalidating user cache', { userId, error });
        }
    }
    async invalidateAssignmentCache(assignmentId) {
        if (!this.cache)
            return;
        try {
            const pattern = `${this.CACHE_PREFIX}*:${assignmentId}:*`;
            await this.cache.deleteByPattern(pattern);
        }
        catch (error) {
            this.logger.error('Error invalidating assignment cache', { assignmentId, error });
        }
    }
}
//# sourceMappingURL=AssignmentAuthorizationService.js.map