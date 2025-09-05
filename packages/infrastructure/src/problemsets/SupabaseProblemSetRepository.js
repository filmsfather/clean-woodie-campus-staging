import { ProblemSet } from '@woodie/domain/problemSets/entities/ProblemSet';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ProblemSetTitle } from '@woodie/domain/problemSets/value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '@woodie/domain/problemSets/value-objects/ProblemSetDescription';
export class SupabaseProblemSetRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    // === 기본 CRUD 작업 ===
    async save(problemSet) {
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
                return Result.fail(`Failed to save problem set: ${problemSetError.message}`);
            }
            // 기존 아이템 삭제 후 새로 저장
            const { error: deleteError } = await this.supabase
                .from('learning.problem_set_items')
                .delete()
                .eq('problem_set_id', persistence.id);
            if (deleteError) {
                return Result.fail(`Failed to delete existing items: ${deleteError.message}`);
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
                    return Result.fail(`Failed to save problem set items: ${itemsError.message}`);
                }
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error saving problem set: ${error}`);
        }
    }
    async findById(id) {
        try {
            // ProblemSet 조회
            const { data: problemSetData, error: problemSetError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('id', id.toString())
                .single();
            if (problemSetError) {
                return Result.fail(`Failed to find problem set: ${problemSetError.message}`);
            }
            if (!problemSetData) {
                return Result.fail('Problem set not found');
            }
            // ProblemSet 아이템들 조회
            const { data: itemsData, error: itemsError } = await this.supabase
                .from('learning.problem_set_items')
                .select('*')
                .eq('problem_set_id', id.toString())
                .order('order_index', { ascending: true });
            if (itemsError) {
                return Result.fail(`Failed to find problem set items: ${itemsError.message}`);
            }
            return this.mapToDomain(problemSetData, itemsData || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem set: ${error}`);
        }
    }
    async delete(id) {
        try {
            // 아이템들 먼저 삭제
            const { error: itemsError } = await this.supabase
                .from('learning.problem_set_items')
                .delete()
                .eq('problem_set_id', id.toString());
            if (itemsError) {
                return Result.fail(`Failed to delete problem set items: ${itemsError.message}`);
            }
            // ProblemSet 삭제
            const { error: problemSetError } = await this.supabase
                .from('learning.problem_sets')
                .delete()
                .eq('id', id.toString());
            if (problemSetError) {
                return Result.fail(`Failed to delete problem set: ${problemSetError.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error deleting problem set: ${error}`);
        }
    }
    // === 단순한 조회 작업 ===
    async findByTeacherId(teacherId) {
        try {
            const { data: problemSetsData, error: problemSetsError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('updated_at', { ascending: false });
            if (problemSetsError) {
                return Result.fail(`Failed to find problem sets: ${problemSetsError.message}`);
            }
            const problemSets = [];
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
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem sets by teacher: ${error}`);
        }
    }
    async findProblemSetsByProblemId(problemId) {
        try {
            // 해당 문제가 포함된 문제집들의 ID 조회
            const { data: itemsData, error: itemsError } = await this.supabase
                .from('learning.problem_set_items')
                .select('problem_set_id')
                .eq('problem_id', problemId.toString());
            if (itemsError) {
                return Result.fail(`Failed to find problem set items: ${itemsError.message}`);
            }
            if (!itemsData || itemsData.length === 0) {
                return Result.ok([]);
            }
            const problemSetIds = itemsData.map(item => item.problem_set_id);
            const uniqueProblemSetIds = [...new Set(problemSetIds)];
            // 문제집들 조회
            const problemSets = [];
            for (const problemSetId of uniqueProblemSetIds) {
                const result = await this.findById(new UniqueEntityID(problemSetId));
                if (result.isSuccess) {
                    problemSets.push(result.value);
                }
            }
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem sets by problem ID: ${error}`);
        }
    }
    async findProblemSetsByProblemIds(problemIds) {
        try {
            const problemIdStrings = problemIds.map(id => id.toString());
            // 해당 문제들이 포함된 문제집들의 ID 조회
            const { data: itemsData, error: itemsError } = await this.supabase
                .from('learning.problem_set_items')
                .select('problem_set_id')
                .in('problem_id', problemIdStrings);
            if (itemsError) {
                return Result.fail(`Failed to find problem set items: ${itemsError.message}`);
            }
            if (!itemsData || itemsData.length === 0) {
                return Result.ok([]);
            }
            const problemSetIds = itemsData.map(item => item.problem_set_id);
            const uniqueProblemSetIds = [...new Set(problemSetIds)];
            // 문제집들 조회
            const problemSets = [];
            for (const problemSetId of uniqueProblemSetIds) {
                const result = await this.findById(new UniqueEntityID(problemSetId));
                if (result.isSuccess) {
                    problemSets.push(result.value);
                }
            }
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem sets by problem IDs: ${error}`);
        }
    }
    async findByTeacherIdAndTitle(teacherId, title) {
        try {
            const { data: problemSetData, error: problemSetError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('title', title)
                .single();
            if (problemSetError) {
                if (problemSetError.code === 'PGRST116') { // No rows returned
                    return Result.fail('Problem set not found');
                }
                return Result.fail(`Failed to find problem set: ${problemSetError.message}`);
            }
            // 아이템들 조회
            const { data: itemsData } = await this.supabase
                .from('learning.problem_set_items')
                .select('*')
                .eq('problem_set_id', problemSetData.id)
                .order('order_index', { ascending: true });
            return this.mapToDomain(problemSetData, itemsData || []);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem set by teacher and title: ${error}`);
        }
    }
    // === 존재 확인 및 소유권 검증 ===
    async exists(id) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problem_sets')
                .select('id')
                .eq('id', id.toString())
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                return Result.fail(`Failed to check existence: ${error.message}`);
            }
            return Result.ok(!!data);
        }
        catch (error) {
            return Result.fail(`Unexpected error checking existence: ${error}`);
        }
    }
    async existsMany(ids) {
        try {
            const idStrings = ids.map(id => id.toString());
            const { data, error } = await this.supabase
                .from('learning.problem_sets')
                .select('id')
                .in('id', idStrings);
            if (error) {
                return Result.fail(`Failed to check multiple existence: ${error.message}`);
            }
            const existingIds = new Set((data || []).map(record => record.id));
            const results = idStrings.map(id => ({
                id,
                exists: existingIds.has(id)
            }));
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Unexpected error checking multiple existence: ${error}`);
        }
    }
    async verifyOwnership(problemSetId, teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problem_sets')
                .select('teacher_id')
                .eq('id', problemSetId.toString())
                .single();
            if (error) {
                return Result.fail(`Failed to verify ownership: ${error.message}`);
            }
            return Result.ok(data?.teacher_id === teacherId);
        }
        catch (error) {
            return Result.fail(`Unexpected error verifying ownership: ${error}`);
        }
    }
    async bulkVerifyOwnership(problemSetIds, teacherId) {
        try {
            const idStrings = problemSetIds.map(id => id.toString());
            const { data, error } = await this.supabase
                .from('learning.problem_sets')
                .select('id, teacher_id')
                .in('id', idStrings);
            if (error) {
                return Result.fail(`Failed to verify ownership: ${error.message}`);
            }
            const ownershipMap = new Map();
            (data || []).forEach(record => {
                ownershipMap.set(record.id, record.teacher_id === teacherId);
            });
            const results = idStrings.map(id => ({
                id,
                isOwner: ownershipMap.get(id) || false
            }));
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Unexpected error verifying bulk ownership: ${error}`);
        }
    }
    // === 단순한 카운팅 ===
    async countByTeacherId(teacherId) {
        try {
            const { count, error } = await this.supabase
                .from('learning.problem_sets')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacherId);
            if (error) {
                return Result.fail(`Failed to count problem sets: ${error.message}`);
            }
            return Result.ok(count || 0);
        }
        catch (error) {
            return Result.fail(`Unexpected error counting problem sets: ${error}`);
        }
    }
    async countProblemSetsByProblemId(problemId) {
        try {
            const { count, error } = await this.supabase
                .from('learning.problem_set_items')
                .select('problem_set_id', { count: 'exact', head: true })
                .eq('problem_id', problemId.toString());
            if (error) {
                return Result.fail(`Failed to count problem sets by problem ID: ${error.message}`);
            }
            return Result.ok(count || 0);
        }
        catch (error) {
            return Result.fail(`Unexpected error counting problem sets by problem ID: ${error}`);
        }
    }
    // === 공유 관련 조회 ===
    async findSharedProblemSets() {
        try {
            const { data: problemSetsData, error: problemSetsError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('is_shared', true)
                .order('updated_at', { ascending: false });
            if (problemSetsError) {
                return Result.fail(`Failed to find shared problem sets: ${problemSetsError.message}`);
            }
            const problemSets = [];
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
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding shared problem sets: ${error}`);
        }
    }
    async findPublicProblemSets() {
        try {
            const { data: problemSetsData, error: problemSetsError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('is_public', true)
                .order('updated_at', { ascending: false });
            if (problemSetsError) {
                return Result.fail(`Failed to find public problem sets: ${problemSetsError.message}`);
            }
            const problemSets = [];
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
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding public problem sets: ${error}`);
        }
    }
    async findSharedProblemSetsExcludingTeacher(excludeTeacherId) {
        try {
            const { data: problemSetsData, error: problemSetsError } = await this.supabase
                .from('learning.problem_sets')
                .select('*')
                .eq('is_shared', true)
                .neq('teacher_id', excludeTeacherId)
                .order('updated_at', { ascending: false });
            if (problemSetsError) {
                return Result.fail(`Failed to find shared problem sets excluding teacher: ${problemSetsError.message}`);
            }
            const problemSets = [];
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
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding shared problem sets excluding teacher: ${error}`);
        }
    }
    // === 헬퍼 메서드들 ===
    mapToDomain(record, items) {
        try {
            // Value Objects 복원
            const titleResult = ProblemSetTitle.create(record.title);
            if (titleResult.isFailure) {
                return Result.fail(`Failed to restore title: ${titleResult.error}`);
            }
            let descriptionVo;
            if (record.description) {
                const descriptionResult = ProblemSetDescription.create(record.description);
                if (descriptionResult.isFailure) {
                    return Result.fail(`Failed to restore description: ${descriptionResult.error}`);
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
                return Result.fail(`Failed to restore problem set: ${problemSetResult.error}`);
            }
            return Result.ok(problemSetResult.value);
        }
        catch (error) {
            return Result.fail(`Failed to map record to domain: ${error}`);
        }
    }
}
//# sourceMappingURL=SupabaseProblemSetRepository.js.map