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

export class AssignmentAuthorizationService {
  private readonly CACHE_PREFIX = 'auth:assignment:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private supabase: SupabaseClient,
    private logger: ILogger,
    private cache?: ICacheService
  ) {}

  async authorizeAssignmentOperation(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    try {
      this.logger.debug('Authorizing assignment operation', { context });

      // Check cache first
      const cacheKey = this.buildCacheKey('operation', context);
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.debug('Authorization cache hit', { context });
        return Result.ok<AuthorizationResult>(cachedResult);
      }

      // Perform authorization check
      const authResult = await this.performAuthorizationCheck(context);
      
      if (authResult.isSuccess) {
        // Cache the result
        await this.cacheResult(cacheKey, authResult.value);
      }

      return authResult;

    } catch (error) {
      this.logger.error('Error in authorization check', { 
        context, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return Result.fail<AuthorizationResult>(`Authorization check failed: ${error}`);
    }
  }

  async canTeacherAccessAssignment(teacherId: string, assignmentId: string): Promise<Result<boolean>> {
    try {
      const context: AuthorizationContext = {
        userId: teacherId,
        userRole: await this.getUserRole(teacherId),
        requestedResource: 'assignment',
        resourceId: assignmentId,
        operation: 'read'
      } as any;

      const authResult = await this.authorizeAssignmentOperation(context);
      
      if (authResult.isFailure) {
        return Result.fail<boolean>(authResult.error);
      }

      return Result.ok<boolean>(authResult.value.isAuthorized);

    } catch (error) {
      return Result.fail<boolean>(`Failed to check teacher assignment access: ${error}`);
    }
  }

  async canStudentAccessAssignment(studentId: string, assignmentId: string): Promise<Result<boolean>> {
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
        return Result.fail<boolean>(`Failed to get assignment: ${assignmentError.message}`);
      }

      if (!assignment) {
        return Result.ok<boolean>(false);
      }

      // Check if student is directly assigned
      const directAssignment = assignment.assignment_targets.find(
        (target: any) => target.target_type === 'student' && 
                       target.target_id === studentId && 
                       target.is_active
      );

      if (directAssignment) {
        return Result.ok<boolean>(true);
      }

      // Check if student is in an assigned class
      const studentClassResult = await this.getStudentClass(studentId);
      if (studentClassResult.isFailure) {
        return Result.fail<boolean>(studentClassResult.error);
      }

      const studentClass = studentClassResult.value;
      if (!studentClass) {
        return Result.ok<boolean>(false);
      }

      const classAssignment = assignment.assignment_targets.find(
        (target: any) => target.target_type === 'class' && 
                       target.target_id === studentClass.classId && 
                       target.is_active
      );

      return Result.ok<boolean>(!!classAssignment);

    } catch (error) {
      return Result.fail<boolean>(`Failed to check student assignment access: ${error}`);
    }
  }

  async canTeacherAssignToClass(teacherId: string, classId: string): Promise<Result<boolean>> {
    try {
      const cacheKey = this.buildCacheKey('teacher_class', `${teacherId}:${classId}`);
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return Result.ok<boolean>(cachedResult.isAuthorized);
      }

      // Get teacher's role and school
      const teacherRole = await this.getUserRole(teacherId);
      
      // Admin can assign to any class in their school
      if (teacherRole.role === 'admin') {
        const result: AuthorizationResult = { isAuthorized: true, reason: 'Admin access' };
        await this.cacheResult(cacheKey, result);
        return Result.ok<boolean>(true);
      }

      // Teacher can only assign to classes in their school
      if (teacherRole.role === 'teacher') {
        const classResult = await this.getClassDetails(classId);
        if (classResult.isFailure) {
          return Result.fail<boolean>(classResult.error);
        }

        const classDetails = classResult.value;
        const canAssign = teacherRole.schoolId === classDetails.schoolId;
        
        const result: AuthorizationResult = { 
          isAuthorized: canAssign, 
          reason: canAssign ? 'Same school' : 'Different school' 
        };
        
        await this.cacheResult(cacheKey, result);
        return Result.ok<boolean>(canAssign);
      }

      return Result.ok<boolean>(false);

    } catch (error) {
      return Result.fail<boolean>(`Failed to check class assignment permission: ${error}`);
    }
  }

  async canTeacherAssignToStudent(teacherId: string, studentId: string): Promise<Result<boolean>> {
    try {
      const cacheKey = this.buildCacheKey('teacher_student', `${teacherId}:${studentId}`);
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return Result.ok<boolean>(cachedResult.isAuthorized);
      }

      // Get both teacher and student roles
      const teacherRole = await this.getUserRole(teacherId);
      const studentRole = await this.getUserRole(studentId);

      // Admin can assign to any student in their school
      if (teacherRole.role === 'admin') {
        const canAssign = teacherRole.schoolId === studentRole.schoolId;
        const result: AuthorizationResult = { 
          isAuthorized: canAssign, 
          reason: canAssign ? 'Admin same school' : 'Admin different school' 
        };
        await this.cacheResult(cacheKey, result);
        return Result.ok<boolean>(canAssign);
      }

      // Teacher can only assign to students in their school
      if (teacherRole.role === 'teacher') {
        const canAssign = teacherRole.schoolId === studentRole.schoolId;
        const result: AuthorizationResult = { 
          isAuthorized: canAssign, 
          reason: canAssign ? 'Same school' : 'Different school' 
        };
        await this.cacheResult(cacheKey, result);
        return Result.ok<boolean>(canAssign);
      }

      return Result.ok<boolean>(false);

    } catch (error) {
      return Result.fail<boolean>(`Failed to check student assignment permission: ${error}`);
    }
  }

  async getStudentClassMemberships(studentId: string): Promise<Result<ClassMembership[]>> {
    try {
      const cacheKey = this.buildCacheKey('student_classes', studentId);
      const cached = await this.cache?.get(cacheKey);
      if (cached) {
        return Result.ok<ClassMembership[]>(JSON.parse(cached));
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
        return Result.fail<ClassMembership[]>(`Failed to get student class memberships: ${error.message}`);
      }

      const classMemberships: ClassMembership[] = (memberships || []).map((membership: any) => ({
        classId: membership.class_id,
        studentId,
        teacherId: membership.auth_classes.teacher_id,
        schoolId: membership.school_id,
        isActive: membership.auth_classes.is_active
      }));

      // Cache the result
      await this.cache?.set(cacheKey, JSON.stringify(classMemberships), this.CACHE_TTL);

      return Result.ok<ClassMembership[]>(classMemberships);

    } catch (error) {
      return Result.fail<ClassMembership[]>(`Failed to get student class memberships: ${error}`);
    }
  }

  // Private helper methods

  private async performAuthorizationCheck(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
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
        return Result.fail<AuthorizationResult>(`Unsupported operation: ${context.operation}`);
    }
  }

  private async checkCreatePermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    // Only teachers and admins can create assignments
    if (context.userRole.role === 'teacher' || context.userRole.role === 'admin') {
      return Result.ok<AuthorizationResult>({
        isAuthorized: true,
        reason: 'Teacher/Admin create permission',
        permissions: ['create_assignment']
      });
    }

    return Result.ok<AuthorizationResult>({
      isAuthorized: false,
      reason: 'Insufficient role for create operation'
    });
  }

  private async checkReadPermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    switch (context.userRole.role) {
      case 'admin':
        // Admin can read any assignment in their school
        return Result.ok<AuthorizationResult>({
          isAuthorized: true,
          reason: 'Admin read permission'
        });
      
      case 'teacher':
        // Teacher can read their own assignments and assignments in their school
        const teacherAccessResult = await this.canTeacherAccessAssignment(
          context.userId,
          context.resourceId
        );
        
        if (teacherAccessResult.isFailure) {
          return Result.fail<AuthorizationResult>(teacherAccessResult.error);
        }

        return Result.ok<AuthorizationResult>({
          isAuthorized: teacherAccessResult.value,
          reason: teacherAccessResult.value ? 'Teacher owns assignment' : 'Teacher does not own assignment'
        });

      case 'student':
        // Student can only read assignments they're assigned to
        const studentAccessResult = await this.canStudentAccessAssignment(
          context.userId,
          context.resourceId
        );
        
        if (studentAccessResult.isFailure) {
          return Result.fail<AuthorizationResult>(studentAccessResult.error);
        }

        return Result.ok<AuthorizationResult>({
          isAuthorized: studentAccessResult.value,
          reason: studentAccessResult.value ? 'Student is assigned' : 'Student is not assigned'
        });

      default:
        return Result.ok<AuthorizationResult>({
          isAuthorized: false,
          reason: 'Unknown role'
        });
    }
  }

  private async checkUpdatePermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    // Only assignment owners can update
    return await this.checkOwnershipPermission(context, 'update');
  }

  private async checkDeletePermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    // Only assignment owners can delete
    return await this.checkOwnershipPermission(context, 'delete');
  }

  private async checkAssignPermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    // Only assignment owners can assign
    return await this.checkOwnershipPermission(context, 'assign');
  }

  private async checkRevokePermission(context: AuthorizationContext): Promise<Result<AuthorizationResult>> {
    // Only assignment owners can revoke
    return await this.checkOwnershipPermission(context, 'revoke');
  }

  private async checkOwnershipPermission(
    context: AuthorizationContext,
    operation: string
  ): Promise<Result<AuthorizationResult>> {
    if (context.userRole.role === 'student') {
      return Result.ok<AuthorizationResult>({
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
      return Result.fail<AuthorizationResult>(`Failed to check assignment ownership: ${error.message}`);
    }

    if (!assignment) {
      return Result.ok<AuthorizationResult>({
        isAuthorized: false,
        reason: 'Assignment not found'
      });
    }

    const isOwner = assignment.teacher_id === context.userId;
    
    return Result.ok<AuthorizationResult>({
      isAuthorized: isOwner,
      reason: isOwner ? `User owns assignment` : `User does not own assignment`
    });
  }

  private async getUserRole(userId: string): Promise<UserRole> {
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

    const userRole: UserRole = {
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

  private async getStudentClass(studentId: string): Promise<Result<{ classId: string; schoolId: string } | null>> {
    const { data: student, error } = await this.supabase
      .from('auth.profiles')
      .select('class_id, school_id')
      .eq('id', studentId)
      .eq('role', 'student')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return Result.fail<{ classId: string; schoolId: string } | null>(
        `Failed to get student class: ${error.message}`
      );
    }

    if (!student || !student.class_id) {
      return Result.ok<{ classId: string; schoolId: string } | null>(null);
    }

    return Result.ok<{ classId: string; schoolId: string } | null>({
      classId: student.class_id,
      schoolId: student.school_id
    });
  }

  private async getClassDetails(classId: string): Promise<Result<{ schoolId: string; teacherId: string }>> {
    const { data: classDetails, error } = await this.supabase
      .from('auth.classes')
      .select('school_id, teacher_id')
      .eq('id', classId)
      .eq('is_active', true)
      .single();

    if (error) {
      return Result.fail<{ schoolId: string; teacherId: string }>(
        `Failed to get class details: ${error.message}`
      );
    }

    return Result.ok<{ schoolId: string; teacherId: string }>({
      schoolId: classDetails.school_id,
      teacherId: classDetails.teacher_id
    });
  }

  // Cache helper methods

  private buildCacheKey(type: string, identifier: string | AuthorizationContext): string {
    if (typeof identifier === 'string') {
      return `${this.CACHE_PREFIX}${type}:${identifier}`;
    }
    
    const context = identifier as AuthorizationContext;
    return `${this.CACHE_PREFIX}${type}:${context.userId}:${context.resourceId}:${context.operation}`;
  }

  private async getCachedResult(cacheKey: string): Promise<AuthorizationResult | null> {
    if (!this.cache) return null;
    
    try {
      const cached = await this.cache.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error('Error getting cached authorization result', { cacheKey, error });
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: AuthorizationResult): Promise<void> {
    if (!this.cache) return;
    
    try {
      await this.cache.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Error caching authorization result', { cacheKey, result, error });
    }
  }

  // Cache invalidation methods

  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.cache) return;
    
    try {
      const pattern = `${this.CACHE_PREFIX}*:${userId}:*`;
      await this.cache.deleteByPattern(pattern);
      
      const userRoleKey = this.buildCacheKey('user_role', userId);
      await this.cache.delete(userRoleKey);

    } catch (error) {
      this.logger.error('Error invalidating user cache', { userId, error });
    }
  }

  async invalidateAssignmentCache(assignmentId: string): Promise<void> {
    if (!this.cache) return;
    
    try {
      const pattern = `${this.CACHE_PREFIX}*:${assignmentId}:*`;
      await this.cache.deleteByPattern(pattern);
      
    } catch (error) {
      this.logger.error('Error invalidating assignment cache', { assignmentId, error });
    }
  }
}