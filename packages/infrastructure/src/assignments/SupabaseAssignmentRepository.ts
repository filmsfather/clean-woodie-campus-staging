import { SupabaseClient } from '@supabase/supabase-js';
import { Assignment, AssignmentStatus } from '@woodie/domain/assignments/entities/Assignment';
import { AssignmentTarget } from '@woodie/domain/assignments/entities/AssignmentTarget';
import { 
  IAssignmentRepository, 
  AssignmentFilter, 
  AssignmentSortOptions, 
  AssignmentPageResult 
} from '@woodie/domain/assignments/repositories/IAssignmentRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { DueDate } from '@woodie/domain/assignments/value-objects/DueDate';
import { AssignmentTargetIdentifier } from '@woodie/domain/assignments/value-objects/AssignmentTargetIdentifier';
import { ClassId } from '@woodie/domain/assignments/value-objects/ClassId';
import { StudentId } from '@woodie/domain/assignments/value-objects/StudentId';

// 데이터베이스 레코드 타입
interface AssignmentRecord {
  id: string;
  teacher_id: string;
  problem_set_id: string;
  title: string;
  description?: string;
  due_date: string;
  max_attempts?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AssignmentTargetRecord {
  id: string;
  assignment_id: string;
  target_type: string; // 'class' | 'student'
  target_id: string;
  assigned_by: string;
  assigned_at: string;
  revoked_by?: string;
  revoked_at?: string;
  is_active: boolean;
}

export class SupabaseAssignmentRepository implements IAssignmentRepository {
  constructor(private supabase: SupabaseClient) {}

  // === 기본 CRUD 작업 ===

  async save(assignment: Assignment): Promise<Result<void>> {
    try {
      const persistence = assignment.toPersistence();
      
      // Assignment 저장
      const { error: assignmentError } = await this.supabase
        .from('learning.assignments')
        .upsert({
          id: persistence.id,
          teacher_id: persistence.teacherId,
          problem_set_id: persistence.problemSetId,
          title: persistence.title,
          description: persistence.description,
          due_date: persistence.dueDate.toISOString(),
          max_attempts: persistence.maxAttempts,
          status: persistence.status,
          created_at: persistence.createdAt.toISOString(),
          updated_at: persistence.updatedAt.toISOString()
        });

      if (assignmentError) {
        return Result.fail<void>(`Failed to save assignment: ${assignmentError.message}`);
      }

      // 기존 배정 대상들 삭제 후 새로 저장
      const { error: deleteTargetsError } = await this.supabase
        .from('learning.assignment_targets')
        .delete()
        .eq('assignment_id', persistence.id);

      if (deleteTargetsError) {
        return Result.fail<void>(`Failed to delete existing targets: ${deleteTargetsError.message}`);
      }

      // 새 배정 대상들 저장
      if (persistence.targets && persistence.targets.length > 0) {
        const targetRecords = persistence.targets.map(target => ({
          id: target.id,
          assignment_id: persistence.id,
          target_type: target.targetType,
          target_id: target.targetId,
          assigned_by: target.assignedBy,
          assigned_at: target.assignedAt.toISOString(),
          revoked_by: target.revokedBy,
          revoked_at: target.revokedAt?.toISOString(),
          is_active: target.isActive
        }));

        const { error: targetsError } = await this.supabase
          .from('learning.assignment_targets')
          .insert(targetRecords);

        if (targetsError) {
          return Result.fail<void>(`Failed to save assignment targets: ${targetsError.message}`);
        }
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Unexpected error saving assignment: ${error}`);
    }
  }

  async findById(id: UniqueEntityID): Promise<Result<Assignment>> {
    try {
      // Assignment 조회
      const { data: assignmentData, error: assignmentError } = await this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('id', id.toString())
        .single();

      if (assignmentError) {
        return Result.fail<Assignment>(`Failed to find assignment: ${assignmentError.message}`);
      }

      if (!assignmentData) {
        return Result.fail<Assignment>('Assignment not found');
      }

      // Assignment 배정 대상들 조회
      const { data: targetsData, error: targetsError } = await this.supabase
        .from('learning.assignment_targets')
        .select('*')
        .eq('assignment_id', id.toString())
        .order('assigned_at', { ascending: true });

      if (targetsError) {
        return Result.fail<Assignment>(`Failed to find assignment targets: ${targetsError.message}`);
      }

      return this.mapToDomain(assignmentData, targetsData || []);
    } catch (error) {
      return Result.fail<Assignment>(`Unexpected error finding assignment: ${error}`);
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // 배정 대상들 먼저 삭제
      const { error: targetsError } = await this.supabase
        .from('learning.assignment_targets')
        .delete()
        .eq('assignment_id', id.toString());

      if (targetsError) {
        return Result.fail<void>(`Failed to delete assignment targets: ${targetsError.message}`);
      }

      // Assignment 삭제
      const { error: assignmentError } = await this.supabase
        .from('learning.assignments')
        .delete()
        .eq('id', id.toString());

      if (assignmentError) {
        return Result.fail<void>(`Failed to delete assignment: ${assignmentError.message}`);
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Unexpected error deleting assignment: ${error}`);
    }
  }

  async exists(id: UniqueEntityID): Promise<Result<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('learning.assignments')
        .select('id')
        .eq('id', id.toString())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        return Result.fail<boolean>(`Failed to check existence: ${error.message}`);
      }

      return Result.ok<boolean>(!!data);
    } catch (error) {
      return Result.fail<boolean>(`Unexpected error checking existence: ${error}`);
    }
  }

  // === 단순한 조회 작업 ===

  async findByTeacherId(teacherId: string): Promise<Result<Assignment[]>> {
    try {
      const { data: assignmentsData, error: assignmentsError } = await this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        return Result.fail<Assignment[]>(`Failed to find assignments: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      return Result.ok<Assignment[]>(assignments);
    } catch (error) {
      return Result.fail<Assignment[]>(`Unexpected error finding assignments by teacher: ${error}`);
    }
  }

  async findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Assignment[]>> {
    try {
      const { data: assignmentsData, error: assignmentsError } = await this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('problem_set_id', problemSetId.toString())
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        return Result.fail<Assignment[]>(`Failed to find assignments by problem set: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      return Result.ok<Assignment[]>(assignments);
    } catch (error) {
      return Result.fail<Assignment[]>(`Unexpected error finding assignments by problem set: ${error}`);
    }
  }

  async findByStatus(status: AssignmentStatus): Promise<Result<Assignment[]>> {
    try {
      const { data: assignmentsData, error: assignmentsError } = await this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        return Result.fail<Assignment[]>(`Failed to find assignments by status: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      return Result.ok<Assignment[]>(assignments);
    } catch (error) {
      return Result.fail<Assignment[]>(`Unexpected error finding assignments by status: ${error}`);
    }
  }

  // === 필터링된 조회 ===

  async findWithFilter(
    filter: AssignmentFilter,
    sort?: AssignmentSortOptions,
    page: number = 1,
    limit: number = 20
  ): Promise<Result<AssignmentPageResult>> {
    try {
      let query = this.supabase
        .from('learning.assignments')
        .select('*', { count: 'exact' });

      // 필터 적용
      if (filter.teacherId) {
        query = query.eq('teacher_id', filter.teacherId);
      }

      if (filter.problemSetId) {
        query = query.eq('problem_set_id', filter.problemSetId.toString());
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.dueDateFrom) {
        query = query.gte('due_date', filter.dueDateFrom.toISOString());
      }

      if (filter.dueDateTo) {
        query = query.lte('due_date', filter.dueDateTo.toISOString());
      }

      if (filter.isOverdue !== undefined) {
        if (filter.isOverdue) {
          query = query.lt('due_date', new Date().toISOString());
        } else {
          query = query.gte('due_date', new Date().toISOString());
        }
      }

      // 정렬 적용
      if (sort) {
        const column = this.mapSortField(sort.field);
        query = query.order(column, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션 적용
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: assignmentsData, error: assignmentsError, count } = await query;

      if (assignmentsError) {
        return Result.fail<AssignmentPageResult>(`Failed to find assignments with filter: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      const result: AssignmentPageResult = {
        assignments,
        total: count || 0,
        page,
        limit,
        hasNext: (count || 0) > page * limit
      };

      return Result.ok<AssignmentPageResult>(result);
    } catch (error) {
      return Result.fail<AssignmentPageResult>(`Unexpected error finding assignments with filter: ${error}`);
    }
  }

  async findActiveAssignments(teacherId?: string): Promise<Result<Assignment[]>> {
    try {
      let query = this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('status', AssignmentStatus.ACTIVE)
        .gte('due_date', new Date().toISOString()); // 마감되지 않은 과제만

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      query = query.order('due_date', { ascending: true });

      const { data: assignmentsData, error: assignmentsError } = await query;

      if (assignmentsError) {
        return Result.fail<Assignment[]>(`Failed to find active assignments: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .eq('is_active', true)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      return Result.ok<Assignment[]>(assignments);
    } catch (error) {
      return Result.fail<Assignment[]>(`Unexpected error finding active assignments: ${error}`);
    }
  }

  async findAssignmentsDueSoon(daysFromNow: number): Promise<Result<Assignment[]>> {
    try {
      const now = new Date();
      const dueThreshold = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

      const { data: assignmentsData, error: assignmentsError } = await this.supabase
        .from('learning.assignments')
        .select('*')
        .eq('status', AssignmentStatus.ACTIVE)
        .gte('due_date', now.toISOString())
        .lte('due_date', dueThreshold.toISOString())
        .order('due_date', { ascending: true });

      if (assignmentsError) {
        return Result.fail<Assignment[]>(`Failed to find assignments due soon: ${assignmentsError.message}`);
      }

      const assignments: Assignment[] = [];
      for (const assignmentData of assignmentsData || []) {
        // 각 과제의 배정 대상들 조회
        const { data: targetsData } = await this.supabase
          .from('learning.assignment_targets')
          .select('*')
          .eq('assignment_id', assignmentData.id)
          .eq('is_active', true)
          .order('assigned_at', { ascending: true });

        const assignmentResult = this.mapToDomain(assignmentData, targetsData || []);
        if (assignmentResult.isSuccess) {
          assignments.push(assignmentResult.value);
        }
      }

      return Result.ok<Assignment[]>(assignments);
    } catch (error) {
      return Result.fail<Assignment[]>(`Unexpected error finding assignments due soon: ${error}`);
    }
  }

  async countByTeacherAndStatus(teacherId: string, status: AssignmentStatus): Promise<Result<number>> {
    try {
      const { count, error } = await this.supabase
        .from('learning.assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', status);

      if (error) {
        return Result.fail<number>(`Failed to count assignments: ${error.message}`);
      }

      return Result.ok<number>(count || 0);
    } catch (error) {
      return Result.fail<number>(`Unexpected error counting assignments: ${error}`);
    }
  }

  // === 헬퍼 메서드들 ===

  private mapToDomain(record: AssignmentRecord, targets: AssignmentTargetRecord[]): Result<Assignment> {
    try {
      // Value Objects 복원
      const dueDateResult = DueDate.create(new Date(record.due_date));
      if (dueDateResult.isFailure) {
        return Result.fail<Assignment>(`Failed to restore due date: ${dueDateResult.error}`);
      }

      // AssignmentTarget 복원
      const assignmentTargets: AssignmentTarget[] = [];
      for (const targetRecord of targets) {
        const targetResult = this.mapTargetToDomain(targetRecord);
        if (targetResult.isSuccess) {
          assignmentTargets.push(targetResult.value);
        }
      }

      // Assignment 복원
      const assignmentResult = Assignment.restore({
        id: record.id,
        teacherId: record.teacher_id,
        problemSetId: record.problem_set_id,
        title: record.title,
        description: record.description,
        dueDate: dueDateResult.value,
        maxAttempts: record.max_attempts,
        status: record.status as AssignmentStatus,
        targets: assignmentTargets,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      });

      if (assignmentResult.isFailure) {
        return Result.fail<Assignment>(`Failed to restore assignment: ${assignmentResult.error}`);
      }

      return Result.ok<Assignment>(assignmentResult.value);
    } catch (error) {
      return Result.fail<Assignment>(`Failed to map record to domain: ${error}`);
    }
  }

  private mapTargetToDomain(record: AssignmentTargetRecord): Result<AssignmentTarget> {
    try {
      // TargetIdentifier 복원
      let targetIdentifier: AssignmentTargetIdentifier;
      
      if (record.target_type === 'class') {
        const classIdResult = ClassId.create(record.target_id);
        if (classIdResult.isFailure) {
          return Result.fail<AssignmentTarget>(`Failed to restore class ID: ${classIdResult.error}`);
        }
        
        const identifierResult = AssignmentTargetIdentifier.createForClass(classIdResult.value);
        if (identifierResult.isFailure) {
          return Result.fail<AssignmentTarget>(`Failed to restore target identifier: ${identifierResult.error}`);
        }
        
        targetIdentifier = identifierResult.value;
      } else if (record.target_type === 'student') {
        const studentIdResult = StudentId.create(record.target_id);
        if (studentIdResult.isFailure) {
          return Result.fail<AssignmentTarget>(`Failed to restore student ID: ${studentIdResult.error}`);
        }
        
        const identifierResult = AssignmentTargetIdentifier.createForStudent(studentIdResult.value);
        if (identifierResult.isFailure) {
          return Result.fail<AssignmentTarget>(`Failed to restore target identifier: ${identifierResult.error}`);
        }
        
        targetIdentifier = identifierResult.value;
      } else {
        return Result.fail<AssignmentTarget>(`Invalid target type: ${record.target_type}`);
      }

      // AssignmentTarget 복원
      const targetResult = AssignmentTarget.restore({
        id: record.id,
        assignmentId: record.assignment_id,
        targetIdentifier,
        assignedBy: record.assigned_by,
        assignedAt: new Date(record.assigned_at),
        revokedBy: record.revoked_by,
        revokedAt: record.revoked_at ? new Date(record.revoked_at) : undefined,
        isActive: record.is_active
      });

      if (targetResult.isFailure) {
        return Result.fail<AssignmentTarget>(`Failed to restore assignment target: ${targetResult.error}`);
      }

      return Result.ok<AssignmentTarget>(targetResult.value);
    } catch (error) {
      return Result.fail<AssignmentTarget>(`Failed to map target record to domain: ${error}`);
    }
  }

  private mapSortField(field: string): string {
    switch (field) {
      case 'createdAt': return 'created_at';
      case 'updatedAt': return 'updated_at';
      case 'dueDate': return 'due_date';
      case 'title': return 'title';
      default: return 'created_at';
    }
  }
}