import { SupabaseClient } from '@supabase/supabase-js';
import { ProblemSet } from '@woodie/domain/problemSets/entities/ProblemSet';
import { IProblemSetRepository } from '@woodie/domain/problemSets/repositories/IProblemSetRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ProblemSetTitle } from '@woodie/domain/problemSets/value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '@woodie/domain/problemSets/value-objects/ProblemSetDescription';

// 데이터베이스 레코드 타입
interface ProblemSetRecord {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

interface ProblemSetItemRecord {
  id: string;
  problem_set_id: string;
  problem_id: string;
  order_index: number;
  points?: number;
  settings?: any;
  created_at: string;
}

export class SupabaseProblemSetRepository implements IProblemSetRepository {
  constructor(private supabase: SupabaseClient) {}

  // === 기본 CRUD 작업 ===

  async save(problemSet: ProblemSet): Promise<Result<void>> {
    try {
      const persistence = problemSet.toPersistence();
      
      // ProblemSet 저장
      const { error: problemSetError } = await this.supabase
        .from('learning.problem_sets')
        .upsert({
          id: persistence.id,
          teacher_id: persistence.teacherId,
          title: persistence.title,
          description: persistence.description,
          is_public: persistence.isPublic,
          is_shared: persistence.isShared,
          created_at: persistence.createdAt.toISOString(),
          updated_at: persistence.updatedAt.toISOString()
        });

      if (problemSetError) {
        return Result.fail<void>(`Failed to save problem set: ${problemSetError.message}`);
      }

      // 기존 아이템 삭제 후 새로 저장
      const { error: deleteError } = await this.supabase
        .from('learning.problem_set_items')
        .delete()
        .eq('problem_set_id', persistence.id);

      if (deleteError) {
        return Result.fail<void>(`Failed to delete existing items: ${deleteError.message}`);
      }

      // 새 아이템들 저장
      if (persistence.items && persistence.items.length > 0) {
        const itemRecords = persistence.items.map(item => ({
          id: item.id,
          problem_set_id: persistence.id,
          problem_id: item.problemId,
          order_index: item.orderIndex,
          points: item.points,
          settings: item.settings,
          created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await this.supabase
          .from('learning.problem_set_items')
          .insert(itemRecords);

        if (itemsError) {
          return Result.fail<void>(`Failed to save problem set items: ${itemsError.message}`);
        }
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Unexpected error saving problem set: ${error}`);
    }
  }

  async findById(id: UniqueEntityID): Promise<Result<ProblemSet>> {
    try {
      // ProblemSet 조회
      const { data: problemSetData, error: problemSetError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('id', id.toString())
        .single();

      if (problemSetError) {
        return Result.fail<ProblemSet>(`Failed to find problem set: ${problemSetError.message}`);
      }

      if (!problemSetData) {
        return Result.fail<ProblemSet>('Problem set not found');
      }

      // ProblemSet 아이템들 조회
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('learning.problem_set_items')
        .select('*')
        .eq('problem_set_id', id.toString())
        .order('order_index', { ascending: true });

      if (itemsError) {
        return Result.fail<ProblemSet>(`Failed to find problem set items: ${itemsError.message}`);
      }

      return this.mapToDomain(problemSetData, itemsData || []);
    } catch (error) {
      return Result.fail<ProblemSet>(`Unexpected error finding problem set: ${error}`);
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // 아이템들 먼저 삭제
      const { error: itemsError } = await this.supabase
        .from('learning.problem_set_items')
        .delete()
        .eq('problem_set_id', id.toString());

      if (itemsError) {
        return Result.fail<void>(`Failed to delete problem set items: ${itemsError.message}`);
      }

      // ProblemSet 삭제
      const { error: problemSetError } = await this.supabase
        .from('learning.problem_sets')
        .delete()
        .eq('id', id.toString());

      if (problemSetError) {
        return Result.fail<void>(`Failed to delete problem set: ${problemSetError.message}`);
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Unexpected error deleting problem set: ${error}`);
    }
  }

  // === 단순한 조회 작업 ===

  async findByTeacherId(teacherId: string): Promise<Result<ProblemSet[]>> {
    try {
      const { data: problemSetsData, error: problemSetsError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('updated_at', { ascending: false });

      if (problemSetsError) {
        return Result.fail<ProblemSet[]>(`Failed to find problem sets: ${problemSetsError.message}`);
      }

      const problemSets: ProblemSet[] = [];
      for (const problemSetData of problemSetsData || []) {
        // 각 문제집의 아이템들 조회
        const { data: itemsData } = await this.supabase
          .from('learning.problem_set_items')
          .select('*')
          .eq('problem_set_id', problemSetData.id)
          .order('order_index', { ascending: true });

        const problemSetResult = this.mapToDomain(problemSetData, itemsData || []);
        if (problemSetResult.isSuccess) {
          problemSets.push(problemSetResult.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding problem sets by teacher: ${error}`);
    }
  }

  async findProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<ProblemSet[]>> {
    try {
      // 해당 문제가 포함된 문제집들의 ID 조회
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('learning.problem_set_items')
        .select('problem_set_id')
        .eq('problem_id', problemId.toString());

      if (itemsError) {
        return Result.fail<ProblemSet[]>(`Failed to find problem set items: ${itemsError.message}`);
      }

      if (!itemsData || itemsData.length === 0) {
        return Result.ok<ProblemSet[]>([]);
      }

      const problemSetIds = itemsData.map(item => item.problem_set_id);
      const uniqueProblemSetIds = [...new Set(problemSetIds)];

      // 문제집들 조회
      const problemSets: ProblemSet[] = [];
      for (const problemSetId of uniqueProblemSetIds) {
        const result = await this.findById(new UniqueEntityID(problemSetId));
        if (result.isSuccess) {
          problemSets.push(result.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding problem sets by problem ID: ${error}`);
    }
  }

  async findProblemSetsByProblemIds(problemIds: UniqueEntityID[]): Promise<Result<ProblemSet[]>> {
    try {
      const problemIdStrings = problemIds.map(id => id.toString());
      
      // 해당 문제들이 포함된 문제집들의 ID 조회
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('learning.problem_set_items')
        .select('problem_set_id')
        .in('problem_id', problemIdStrings);

      if (itemsError) {
        return Result.fail<ProblemSet[]>(`Failed to find problem set items: ${itemsError.message}`);
      }

      if (!itemsData || itemsData.length === 0) {
        return Result.ok<ProblemSet[]>([]);
      }

      const problemSetIds = itemsData.map(item => item.problem_set_id);
      const uniqueProblemSetIds = [...new Set(problemSetIds)];

      // 문제집들 조회
      const problemSets: ProblemSet[] = [];
      for (const problemSetId of uniqueProblemSetIds) {
        const result = await this.findById(new UniqueEntityID(problemSetId));
        if (result.isSuccess) {
          problemSets.push(result.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding problem sets by problem IDs: ${error}`);
    }
  }

  async findByTeacherIdAndTitle(teacherId: string, title: string): Promise<Result<ProblemSet>> {
    try {
      const { data: problemSetData, error: problemSetError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('title', title)
        .single();

      if (problemSetError) {
        if (problemSetError.code === 'PGRST116') { // No rows returned
          return Result.fail<ProblemSet>('Problem set not found');
        }
        return Result.fail<ProblemSet>(`Failed to find problem set: ${problemSetError.message}`);
      }

      // 아이템들 조회
      const { data: itemsData } = await this.supabase
        .from('learning.problem_set_items')
        .select('*')
        .eq('problem_set_id', problemSetData.id)
        .order('order_index', { ascending: true });

      return this.mapToDomain(problemSetData, itemsData || []);
    } catch (error) {
      return Result.fail<ProblemSet>(`Unexpected error finding problem set by teacher and title: ${error}`);
    }
  }

  // === 존재 확인 및 소유권 검증 ===

  async exists(id: UniqueEntityID): Promise<Result<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('learning.problem_sets')
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

  async existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{ id: string; exists: boolean }>>> {
    try {
      const idStrings = ids.map(id => id.toString());
      
      const { data, error } = await this.supabase
        .from('learning.problem_sets')
        .select('id')
        .in('id', idStrings);

      if (error) {
        return Result.fail<Array<{ id: string; exists: boolean }>>(`Failed to check multiple existence: ${error.message}`);
      }

      const existingIds = new Set((data || []).map(record => record.id));
      
      const results = idStrings.map(id => ({
        id,
        exists: existingIds.has(id)
      }));

      return Result.ok<Array<{ id: string; exists: boolean }>>(results);
    } catch (error) {
      return Result.fail<Array<{ id: string; exists: boolean }>>(`Unexpected error checking multiple existence: ${error}`);
    }
  }

  async verifyOwnership(problemSetId: UniqueEntityID, teacherId: string): Promise<Result<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('learning.problem_sets')
        .select('teacher_id')
        .eq('id', problemSetId.toString())
        .single();

      if (error) {
        return Result.fail<boolean>(`Failed to verify ownership: ${error.message}`);
      }

      return Result.ok<boolean>(data?.teacher_id === teacherId);
    } catch (error) {
      return Result.fail<boolean>(`Unexpected error verifying ownership: ${error}`);
    }
  }

  async bulkVerifyOwnership(
    problemSetIds: UniqueEntityID[],
    teacherId: string
  ): Promise<Result<Array<{ id: string; isOwner: boolean }>>> {
    try {
      const idStrings = problemSetIds.map(id => id.toString());
      
      const { data, error } = await this.supabase
        .from('learning.problem_sets')
        .select('id, teacher_id')
        .in('id', idStrings);

      if (error) {
        return Result.fail<Array<{ id: string; isOwner: boolean }>>(`Failed to verify ownership: ${error.message}`);
      }

      const ownershipMap = new Map<string, boolean>();
      (data || []).forEach(record => {
        ownershipMap.set(record.id, record.teacher_id === teacherId);
      });

      const results = idStrings.map(id => ({
        id,
        isOwner: ownershipMap.get(id) || false
      }));

      return Result.ok<Array<{ id: string; isOwner: boolean }>>(results);
    } catch (error) {
      return Result.fail<Array<{ id: string; isOwner: boolean }>>(`Unexpected error verifying bulk ownership: ${error}`);
    }
  }

  // === 단순한 카운팅 ===

  async countByTeacherId(teacherId: string): Promise<Result<number>> {
    try {
      const { count, error } = await this.supabase
        .from('learning.problem_sets')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId);

      if (error) {
        return Result.fail<number>(`Failed to count problem sets: ${error.message}`);
      }

      return Result.ok<number>(count || 0);
    } catch (error) {
      return Result.fail<number>(`Unexpected error counting problem sets: ${error}`);
    }
  }

  async countProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<number>> {
    try {
      const { count, error } = await this.supabase
        .from('learning.problem_set_items')
        .select('problem_set_id', { count: 'exact', head: true })
        .eq('problem_id', problemId.toString());

      if (error) {
        return Result.fail<number>(`Failed to count problem sets by problem ID: ${error.message}`);
      }

      return Result.ok<number>(count || 0);
    } catch (error) {
      return Result.fail<number>(`Unexpected error counting problem sets by problem ID: ${error}`);
    }
  }

  // === 공유 관련 조회 ===

  async findSharedProblemSets(): Promise<Result<ProblemSet[]>> {
    try {
      const { data: problemSetsData, error: problemSetsError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('is_shared', true)
        .order('updated_at', { ascending: false });

      if (problemSetsError) {
        return Result.fail<ProblemSet[]>(`Failed to find shared problem sets: ${problemSetsError.message}`);
      }

      const problemSets: ProblemSet[] = [];
      for (const problemSetData of problemSetsData || []) {
        const { data: itemsData } = await this.supabase
          .from('learning.problem_set_items')
          .select('*')
          .eq('problem_set_id', problemSetData.id)
          .order('order_index', { ascending: true });

        const problemSetResult = this.mapToDomain(problemSetData, itemsData || []);
        if (problemSetResult.isSuccess) {
          problemSets.push(problemSetResult.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding shared problem sets: ${error}`);
    }
  }

  async findPublicProblemSets(): Promise<Result<ProblemSet[]>> {
    try {
      const { data: problemSetsData, error: problemSetsError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (problemSetsError) {
        return Result.fail<ProblemSet[]>(`Failed to find public problem sets: ${problemSetsError.message}`);
      }

      const problemSets: ProblemSet[] = [];
      for (const problemSetData of problemSetsData || []) {
        const { data: itemsData } = await this.supabase
          .from('learning.problem_set_items')
          .select('*')
          .eq('problem_set_id', problemSetData.id)
          .order('order_index', { ascending: true });

        const problemSetResult = this.mapToDomain(problemSetData, itemsData || []);
        if (problemSetResult.isSuccess) {
          problemSets.push(problemSetResult.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding public problem sets: ${error}`);
    }
  }

  async findSharedProblemSetsExcludingTeacher(excludeTeacherId: string): Promise<Result<ProblemSet[]>> {
    try {
      const { data: problemSetsData, error: problemSetsError } = await this.supabase
        .from('learning.problem_sets')
        .select('*')
        .eq('is_shared', true)
        .neq('teacher_id', excludeTeacherId)
        .order('updated_at', { ascending: false });

      if (problemSetsError) {
        return Result.fail<ProblemSet[]>(`Failed to find shared problem sets excluding teacher: ${problemSetsError.message}`);
      }

      const problemSets: ProblemSet[] = [];
      for (const problemSetData of problemSetsData || []) {
        const { data: itemsData } = await this.supabase
          .from('learning.problem_set_items')
          .select('*')
          .eq('problem_set_id', problemSetData.id)
          .order('order_index', { ascending: true });

        const problemSetResult = this.mapToDomain(problemSetData, itemsData || []);
        if (problemSetResult.isSuccess) {
          problemSets.push(problemSetResult.value);
        }
      }

      return Result.ok<ProblemSet[]>(problemSets);
    } catch (error) {
      return Result.fail<ProblemSet[]>(`Unexpected error finding shared problem sets excluding teacher: ${error}`);
    }
  }

  // === 헬퍼 메서드들 ===

  private mapToDomain(record: ProblemSetRecord, items: ProblemSetItemRecord[]): Result<ProblemSet> {
    try {
      // Value Objects 복원
      const titleResult = ProblemSetTitle.create(record.title);
      if (titleResult.isFailure) {
        return Result.fail<ProblemSet>(`Failed to restore title: ${titleResult.error}`);
      }

      let descriptionVo: ProblemSetDescription | undefined;
      if (record.description) {
        const descriptionResult = ProblemSetDescription.create(record.description);
        if (descriptionResult.isFailure) {
          return Result.fail<ProblemSet>(`Failed to restore description: ${descriptionResult.error}`);
        }
        descriptionVo = descriptionResult.value;
      }

      // ProblemSet 복원
      const problemSetResult = ProblemSet.restore({
        id: record.id,
        teacherId: record.teacher_id,
        title: titleResult.value,
        description: descriptionVo,
        isPublic: record.is_public,
        isShared: record.is_shared,
        items: items.map(item => ({
          id: item.id,
          problemId: item.problem_id,
          orderIndex: item.order_index,
          points: item.points,
          settings: item.settings
        })),
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      });

      if (problemSetResult.isFailure) {
        return Result.fail<ProblemSet>(`Failed to restore problem set: ${problemSetResult.error}`);
      }

      return Result.ok<ProblemSet>(problemSetResult.value);
    } catch (error) {
      return Result.fail<ProblemSet>(`Failed to map record to domain: ${error}`);
    }
  }
}