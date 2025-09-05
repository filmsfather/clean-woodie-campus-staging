import { Problem } from '@woodie/domain/problems/entities/Problem';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ProblemContent } from '@woodie/domain/problems/value-objects/ProblemContent';
import { AnswerContent } from '@woodie/domain/problems/value-objects/AnswerContent';
import { Difficulty } from '@woodie/domain/problems/value-objects/Difficulty';
import { Tag } from '@woodie/domain/problems/value-objects/Tag';
export class SupabaseProblemRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    // === 기본 CRUD 작업 ===
    async save(problem) {
        try {
            const persistence = problem.toPersistence();
            const { error } = await this.supabase
                .from('learning.problems')
                .upsert({
                id: persistence.id,
                teacher_id: persistence.teacherId,
                content: persistence.content,
                correct_answer: persistence.correctAnswer,
                type: persistence.content.type,
                difficulty: persistence.difficulty,
                tags: persistence.tags,
                is_active: persistence.isActive,
                created_at: persistence.createdAt.toISOString(),
                updated_at: persistence.updatedAt.toISOString()
            });
            if (error) {
                return Result.fail(`Failed to save problem: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error saving problem: ${error}`);
        }
    }
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('*')
                .eq('id', id.toString())
                .single();
            if (error) {
                return Result.fail(`Failed to find problem: ${error.message}`);
            }
            if (!data) {
                return Result.fail('Problem not found');
            }
            return this.mapToDomain(data);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem: ${error}`);
        }
    }
    async delete(id) {
        try {
            const { error } = await this.supabase
                .from('learning.problems')
                .delete()
                .eq('id', id.toString());
            if (error) {
                return Result.fail(`Failed to delete problem: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Unexpected error deleting problem: ${error}`);
        }
    }
    // === 교사별 문제 뱅크 작업 ===
    async findByTeacherId(teacherId, options = {}) {
        try {
            let query = this.supabase
                .from('learning.problems')
                .select('*')
                .eq('teacher_id', teacherId);
            // 활성 상태 필터링
            if (options.includeInactive !== true) {
                query = query.eq('is_active', true);
            }
            // 태그 필터링
            if (options.tagFilter && options.tagFilter.length > 0) {
                query = query.overlaps('tags', options.tagFilter);
            }
            // 난이도 범위 필터링
            if (options.difficultyRange) {
                query = query
                    .gte('difficulty', options.difficultyRange.min)
                    .lte('difficulty', options.difficultyRange.max);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find problems: ${error.message}`);
            }
            const problems = [];
            for (const record of data || []) {
                const problemResult = this.mapToDomain(record);
                if (problemResult.isFailure) {
                    continue; // 매핑 실패한 문제는 스킵
                }
                problems.push(problemResult.value);
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problems: ${error}`);
        }
    }
    async searchProblems(filter, pagination, sort) {
        try {
            let query = this.supabase.from('learning.problems').select('*', { count: 'exact' });
            // 필터 적용
            if (filter.teacherId) {
                query = query.eq('teacher_id', filter.teacherId);
            }
            if (filter.typeValues && filter.typeValues.length > 0) {
                query = query.in('type', filter.typeValues);
            }
            if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
                query = query.in('difficulty', filter.difficultyLevels);
            }
            if (filter.tagNames && filter.tagNames.length > 0) {
                query = query.overlaps('tags', filter.tagNames);
            }
            if (filter.isActive !== undefined) {
                query = query.eq('is_active', filter.isActive);
            }
            if (filter.searchQuery) {
                query = query.textSearch('search_vector', filter.searchQuery);
            }
            if (filter.createdAfter) {
                query = query.gte('created_at', filter.createdAfter.toISOString());
            }
            if (filter.createdBefore) {
                query = query.lte('created_at', filter.createdBefore.toISOString());
            }
            // 정렬 적용
            if (sort) {
                const column = this.mapSortField(sort.field);
                query = query.order(column, { ascending: sort.direction === 'ASC' });
            }
            else {
                query = query.order('created_at', { ascending: false });
            }
            // 페이지네이션 적용
            if (pagination) {
                if (pagination.strategy === 'offset' && pagination.page !== undefined) {
                    const offset = (pagination.page - 1) * pagination.limit;
                    query = query.range(offset, offset + pagination.limit - 1);
                }
                else if (pagination.strategy === 'cursor' && pagination.cursor) {
                    // Cursor 기반 페이지네이션 구현
                    const cursorField = this.mapSortField(pagination.cursor.field);
                    if (pagination.cursor.direction === 'after') {
                        query = query.gt(cursorField, pagination.cursor.value);
                    }
                    else {
                        query = query.lt(cursorField, pagination.cursor.value);
                    }
                    query = query.limit(pagination.limit);
                }
                else {
                    query = query.limit(pagination.limit);
                }
            }
            const { data, error, count } = await query;
            if (error) {
                return Result.fail(`Search failed: ${error.message}`);
            }
            const problems = [];
            for (const record of data || []) {
                const problemResult = this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            const metadata = this.buildSearchMetadata(problems, count || 0, pagination);
            return Result.ok({ problems, metadata });
        }
        catch (error) {
            return Result.fail(`Unexpected search error: ${error}`);
        }
    }
    async getTeacherStatistics(teacherId) {
        try {
            // 기본 통계 쿼리
            const { data: problems, error } = await this.supabase
                .from('learning.problems')
                .select('type, difficulty, tags, is_active, created_at, updated_at')
                .eq('teacher_id', teacherId);
            if (error) {
                return Result.fail(`Failed to get statistics: ${error.message}`);
            }
            const stats = this.calculateStatistics(problems || []);
            return Result.ok(stats);
        }
        catch (error) {
            return Result.fail(`Unexpected error calculating statistics: ${error}`);
        }
    }
    // === 문제 뱅크 관리 ===
    async cloneProblem(problemId, options) {
        try {
            const originalResult = await this.findById(problemId);
            if (originalResult.isFailure) {
                return Result.fail(`Failed to find original problem: ${originalResult.error}`);
            }
            const cloneResult = originalResult.value.clone(options.newTeacherId);
            if (cloneResult.isFailure) {
                return Result.fail(`Failed to clone problem: ${cloneResult.error}`);
            }
            const clonedProblem = cloneResult.value;
            // 옵션 적용
            if (options.markAsActive !== undefined) {
                if (options.markAsActive) {
                    clonedProblem.activate();
                }
                else {
                    clonedProblem.deactivate();
                }
            }
            const saveResult = await this.save(clonedProblem);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save cloned problem: ${saveResult.error}`);
            }
            return Result.ok(clonedProblem);
        }
        catch (error) {
            return Result.fail(`Unexpected error cloning problem: ${error}`);
        }
    }
    async cloneProblems(problemIds, targetTeacherId, options = {}) {
        try {
            const clonedProblems = [];
            const errors = [];
            for (const problemId of problemIds) {
                const cloneResult = await this.cloneProblem(problemId, {
                    newTeacherId: targetTeacherId,
                    ...options
                });
                if (cloneResult.isSuccess) {
                    clonedProblems.push(cloneResult.value);
                }
                else {
                    errors.push(`Failed to clone ${problemId.toString()}: ${cloneResult.error}`);
                }
            }
            if (errors.length > 0 && clonedProblems.length === 0) {
                return Result.fail(`All cloning failed: ${errors.join(', ')}`);
            }
            return Result.ok(clonedProblems);
        }
        catch (error) {
            return Result.fail(`Unexpected error cloning problems: ${error}`);
        }
    }
    // === 고급 검색 및 분석 ===
    async groupProblemsByTag(teacherId, tagNames) {
        try {
            let query = this.supabase
                .from('learning.problems')
                .select('id, tags')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
            if (tagNames && tagNames.length > 0) {
                query = query.overlaps('tags', tagNames);
            }
            const { data, error } = await query;
            if (error) {
                return Result.fail(`Failed to group by tags: ${error.message}`);
            }
            const tagGroups = new Map();
            for (const record of data || []) {
                for (const tag of record.tags || []) {
                    if (!tagGroups.has(tag)) {
                        tagGroups.set(tag, []);
                    }
                    tagGroups.get(tag).push(record.id);
                }
            }
            const results = [];
            for (const [tagName, problemIds] of tagGroups) {
                // 각 태그별 문제들을 조회
                const problemsResult = await this.findProblemsByIds(problemIds);
                if (problemsResult.isSuccess) {
                    results.push({
                        tagName,
                        problems: problemsResult.value,
                        count: problemsResult.value.length
                    });
                }
            }
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Unexpected error grouping by tags: ${error}`);
        }
    }
    async getDifficultyDistribution(teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('difficulty')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
            if (error) {
                return Result.fail(`Failed to get difficulty distribution: ${error.message}`);
            }
            const distribution = new Map();
            let total = 0;
            for (const record of data || []) {
                const difficulty = record.difficulty;
                distribution.set(difficulty, (distribution.get(difficulty) || 0) + 1);
                total++;
            }
            const results = [];
            for (const [difficulty, count] of distribution) {
                results.push({
                    difficulty,
                    count,
                    percentage: total > 0 ? (count / total) * 100 : 0
                });
            }
            results.sort((a, b) => a.difficulty - b.difficulty);
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Unexpected error getting difficulty distribution: ${error}`);
        }
    }
    // === 권한 및 접근 제어 ===
    async verifyOwnership(problemId, teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('teacher_id')
                .eq('id', problemId.toString())
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
    async canAccess(problemId, teacherId) {
        // 현재는 소유권 확인과 동일하지만, 향후 공유 기능 등을 위해 분리
        return this.verifyOwnership(problemId, teacherId);
    }
    // === 성능 최적화 ===
    async findProblemIdsByTeacher(teacherId, filter) {
        try {
            let query = this.supabase
                .from('learning.problems')
                .select('id')
                .eq('teacher_id', teacherId);
            if (filter?.typeValues && filter.typeValues.length > 0) {
                query = query.in('type', filter.typeValues);
            }
            if (filter?.difficultyLevels && filter.difficultyLevels.length > 0) {
                query = query.in('difficulty', filter.difficultyLevels);
            }
            if (filter?.isActive !== undefined) {
                query = query.eq('is_active', filter.isActive);
            }
            const { data, error } = await query;
            if (error) {
                return Result.fail(`Failed to find problem IDs: ${error.message}`);
            }
            const ids = (data || []).map(record => new UniqueEntityID(record.id));
            return Result.ok(ids);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problem IDs: ${error}`);
        }
    }
    async exists(id) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
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
                .from('learning.problems')
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
    // === 미구현 메서드들 (추후 구현) ===
    async findSimilarProblems() {
        return Result.fail('Similar problems search not yet implemented');
    }
    async exportProblemBank() {
        return Result.fail('Problem bank export not yet implemented');
    }
    async importProblemBank() {
        return Result.fail('Problem bank import not yet implemented');
    }
    async bulkUpdateActiveStatus() {
        return Result.fail('Bulk active status update not yet implemented');
    }
    async bulkUpdateTags() {
        return Result.fail('Bulk tag update not yet implemented');
    }
    // === 헬퍼 메서드들 ===
    async findProblemsByIds(ids) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('*')
                .in('id', ids);
            if (error) {
                return Result.fail(`Failed to find problems by IDs: ${error.message}`);
            }
            const problems = [];
            for (const record of data || []) {
                const problemResult = this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Unexpected error finding problems by IDs: ${error}`);
        }
    }
    mapToDomain(record) {
        try {
            // Value Objects 복원
            const contentResult = ProblemContent.fromPrimitive(record.content);
            if (contentResult.isFailure) {
                return Result.fail(`Failed to restore content: ${contentResult.error}`);
            }
            const answerResult = AnswerContent.fromPrimitive(record.correct_answer);
            if (answerResult.isFailure) {
                return Result.fail(`Failed to restore answer: ${answerResult.error}`);
            }
            const difficultyResult = Difficulty.create(record.difficulty);
            if (difficultyResult.isFailure) {
                return Result.fail(`Failed to restore difficulty: ${difficultyResult.error}`);
            }
            const tags = record.tags.map(tagName => Tag.create(tagName).value).filter(Boolean);
            // Problem 복원
            return Problem.restore({
                id: record.id,
                teacherId: record.teacher_id,
                content: contentResult.value,
                correctAnswer: answerResult.value,
                difficulty: difficultyResult.value,
                tags,
                isActive: record.is_active,
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at)
            });
        }
        catch (error) {
            return Result.fail(`Failed to map record to domain: ${error}`);
        }
    }
    mapSortField(field) {
        switch (field) {
            case 'createdAt': return 'created_at';
            case 'updatedAt': return 'updated_at';
            case 'difficulty': return 'difficulty';
            case 'title': return 'content->>title'; // JSONB 필드 접근
            default: return 'created_at';
        }
    }
    buildSearchMetadata(problems, totalCount, pagination) {
        if (!pagination) {
            return {
                hasNextPage: false,
                hasPreviousPage: false
            };
        }
        if (pagination.strategy === 'offset' && pagination.page !== undefined) {
            const totalPages = Math.ceil(totalCount / pagination.limit);
            const currentPage = pagination.page;
            return {
                totalCount,
                currentPage,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            };
        }
        else if (pagination.strategy === 'cursor') {
            const hasNextPage = problems.length === pagination.limit;
            const nextCursor = hasNextPage && problems.length > 0
                ? this.generateCursor(problems[problems.length - 1], pagination.cursor.field)
                : undefined;
            return {
                hasNextPage,
                hasPreviousPage: !!pagination.cursor,
                nextCursor,
                previousCursor: pagination.cursor ? this.generateCursor(problems[0], pagination.cursor.field) : undefined
            };
        }
        return {
            hasNextPage: problems.length === pagination.limit,
            hasPreviousPage: false
        };
    }
    generateCursor(problem, field) {
        switch (field) {
            case 'id': return problem.id.toString();
            case 'createdAt': return problem.createdAt.toISOString();
            case 'updatedAt': return problem.updatedAt.toISOString();
            default: return problem.id.toString();
        }
    }
    calculateStatistics(records) {
        const totalProblems = records.length;
        const activeProblems = records.filter(r => r.is_active).length;
        const inactiveProblems = totalProblems - activeProblems;
        // 타입별 분포
        const typeMap = new Map();
        records.forEach(r => {
            typeMap.set(r.type, (typeMap.get(r.type) || 0) + 1);
        });
        const problemsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
            type,
            count
        }));
        // 난이도별 분포
        const difficultyMap = new Map();
        records.forEach(r => {
            difficultyMap.set(r.difficulty, (difficultyMap.get(r.difficulty) || 0) + 1);
        });
        const problemsByDifficulty = Array.from(difficultyMap.entries()).map(([difficulty, count]) => ({
            difficulty,
            count,
            percentage: totalProblems > 0 ? (count / totalProblems) * 100 : 0
        }));
        // 태그 분석
        const tagMap = new Map();
        let totalTags = 0;
        records.forEach(r => {
            (r.tags || []).forEach((tag) => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
                totalTags++;
            });
        });
        const averageTagsPerProblem = totalProblems > 0 ? totalTags / totalProblems : 0;
        const mostUsedTags = Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
        // 최근 활동
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const createdThisWeek = records.filter(r => new Date(r.created_at) >= oneWeekAgo).length;
        const createdThisMonth = records.filter(r => new Date(r.created_at) >= oneMonthAgo).length;
        const updatedThisWeek = records.filter(r => new Date(r.updated_at) >= oneWeekAgo).length;
        return {
            totalProblems,
            problemsByType,
            problemsByDifficulty,
            activeProblems,
            inactiveProblems,
            averageTagsPerProblem,
            mostUsedTags,
            recentActivity: {
                createdThisWeek,
                createdThisMonth,
                updatedThisWeek
            }
        };
    }
    // === 누락된 메서드들 구현 ===
    async getTeacherTagStatistics(teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('tags')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
            if (error) {
                return Result.fail(`Failed to get tag statistics: ${error.message}`);
            }
            const tagCounts = new Map();
            let totalTags = 0;
            data.forEach((record) => {
                (record.tags || []).forEach((tag) => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    totalTags++;
                });
            });
            const statistics = Array.from(tagCounts.entries()).map(([tag, count]) => ({
                tag,
                count,
                percentage: totalTags > 0 ? (count / totalTags) * 100 : 0
            }));
            return Result.ok(statistics);
        }
        catch (error) {
            return Result.fail(`Error getting teacher tag statistics: ${error}`);
        }
    }
    async getTeacherUniqueTags(teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('tags')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
            if (error) {
                return Result.fail(`Failed to get unique tags: ${error.message}`);
            }
            const uniqueTags = new Set();
            data.forEach((record) => {
                (record.tags || []).forEach((tag) => {
                    uniqueTags.add(tag);
                });
            });
            return Result.ok(Array.from(uniqueTags).sort());
        }
        catch (error) {
            return Result.fail(`Error getting teacher unique tags: ${error}`);
        }
    }
    async getTeacherTypeDistribution(teacherId) {
        try {
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('type')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
            if (error) {
                return Result.fail(`Failed to get type distribution: ${error.message}`);
            }
            const typeCounts = new Map();
            data.forEach((record) => {
                const type = record.type || 'unknown';
                typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
            });
            const totalProblems = data.length;
            const distribution = Array.from(typeCounts.entries()).map(([type, count]) => ({
                type,
                count,
                percentage: totalProblems > 0 ? (count / totalProblems) * 100 : 0
            }));
            return Result.ok(distribution);
        }
        catch (error) {
            return Result.fail(`Error getting teacher type distribution: ${error}`);
        }
    }
    async bulkVerifyOwnership(problemIds, teacherId) {
        try {
            const ids = problemIds.map(id => id.toString());
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('id, teacher_id')
                .in('id', ids);
            if (error) {
                return Result.fail(`Failed to verify ownership: ${error.message}`);
            }
            const ownershipMap = new Map();
            data.forEach((record) => {
                ownershipMap.set(record.id, record.teacher_id === teacherId);
            });
            const results = ids.map(id => ({
                id,
                isOwner: ownershipMap.get(id) || false
            }));
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Error verifying bulk ownership: ${error}`);
        }
    }
    async bulkCanAccess(problemIds, teacherId) {
        try {
            const ids = problemIds.map(id => id.toString());
            const { data, error } = await this.supabase
                .from('learning.problems')
                .select('id, teacher_id, is_active')
                .in('id', ids);
            if (error) {
                return Result.fail(`Failed to check access: ${error.message}`);
            }
            const accessMap = new Map();
            data.forEach((record) => {
                // 교사가 소유하거나 활성화된 문제에 접근 가능
                const canAccess = record.teacher_id === teacherId || record.is_active;
                accessMap.set(record.id, canAccess);
            });
            const results = ids.map(id => ({
                id,
                canAccess: accessMap.get(id) || false
            }));
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Error checking bulk access: ${error}`);
        }
    }
    // === Additional methods used by CachedProblemService ===
    async create(problem) {
        const saveResult = await this.save(problem);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.error);
        }
        return Result.ok(problem);
    }
    async update(problem) {
        const saveResult = await this.save(problem);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.error);
        }
        return Result.ok(problem);
    }
    async findByTeacher(teacherId, options) {
        return this.findByTeacherId(teacherId, options);
    }
    async search(query, filter) {
        try {
            let queryBuilder = this.supabase
                .from('learning.problems')
                .select('*');
            // Add text search if query provided
            if (query) {
                queryBuilder = queryBuilder.textSearch('content', query);
            }
            // Apply filters
            if (filter?.teacherId) {
                queryBuilder = queryBuilder.eq('teacher_id', filter.teacherId);
            }
            if (filter?.isActive !== undefined) {
                queryBuilder = queryBuilder.eq('is_active', filter.isActive);
            }
            const { data, error } = await queryBuilder;
            if (error) {
                return Result.fail(`Failed to search problems: ${error.message}`);
            }
            const problems = [];
            for (const record of data) {
                const problemResult = await this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Error searching problems: ${error}`);
        }
    }
    async findByTags(tagNames, teacherId) {
        try {
            let queryBuilder = this.supabase
                .from('learning.problems')
                .select('*')
                .overlaps('tags', tagNames);
            if (teacherId) {
                queryBuilder = queryBuilder.eq('teacher_id', teacherId);
            }
            const { data, error } = await queryBuilder;
            if (error) {
                return Result.fail(`Failed to find problems by tags: ${error.message}`);
            }
            const problems = [];
            for (const record of data) {
                const problemResult = await this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Error finding problems by tags: ${error}`);
        }
    }
    async findPopular(limit = 10, teacherId) {
        try {
            let queryBuilder = this.supabase
                .from('learning.problems')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (teacherId) {
                queryBuilder = queryBuilder.eq('teacher_id', teacherId);
            }
            const { data, error } = await queryBuilder;
            if (error) {
                return Result.fail(`Failed to find popular problems: ${error.message}`);
            }
            const problems = [];
            for (const record of data) {
                const problemResult = await this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Error finding popular problems: ${error}`);
        }
    }
    async getStatistics(teacherId) {
        return this.getTeacherStatistics(teacherId || '');
    }
    // Find many problems with criteria and pagination
    async findMany(criteria, pagination) {
        try {
            let query = this.supabase
                .from('learning.problems')
                .select('*');
            // Apply criteria filters
            if (criteria) {
                if (criteria.teacherId) {
                    query = query.eq('teacher_id', criteria.teacherId);
                }
                if (criteria.isActive !== undefined) {
                    query = query.eq('is_active', criteria.isActive);
                }
                if (criteria.difficulty !== undefined) {
                    query = query.eq('difficulty', criteria.difficulty);
                }
                if (criteria.type) {
                    query = query.eq('type', criteria.type);
                }
                if (criteria.tags && Array.isArray(criteria.tags) && criteria.tags.length > 0) {
                    query = query.overlaps('tags', criteria.tags);
                }
            }
            // Apply pagination
            if (pagination) {
                query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
            }
            // Default ordering
            query = query.order('created_at', { ascending: false });
            const { data, error } = await query;
            if (error) {
                return Result.fail(`Failed to find many problems: ${error.message}`);
            }
            const problems = [];
            for (const record of data || []) {
                const problemResult = this.mapToDomain(record);
                if (problemResult.isSuccess) {
                    problems.push(problemResult.value);
                }
            }
            return Result.ok(problems);
        }
        catch (error) {
            return Result.fail(`Error finding many problems: ${error}`);
        }
    }
    // Count problems matching criteria
    async count(criteria) {
        try {
            let query = this.supabase
                .from('learning.problems')
                .select('*', { count: 'exact', head: true });
            // Apply criteria filters
            if (criteria) {
                if (criteria.teacherId) {
                    query = query.eq('teacher_id', criteria.teacherId);
                }
                if (criteria.isActive !== undefined) {
                    query = query.eq('is_active', criteria.isActive);
                }
                if (criteria.difficulty !== undefined) {
                    query = query.eq('difficulty', criteria.difficulty);
                }
                if (criteria.type) {
                    query = query.eq('type', criteria.type);
                }
                if (criteria.tags && Array.isArray(criteria.tags) && criteria.tags.length > 0) {
                    query = query.overlaps('tags', criteria.tags);
                }
            }
            const { count, error } = await query;
            if (error) {
                return Result.fail(`Failed to count problems: ${error.message}`);
            }
            return Result.ok(count || 0);
        }
        catch (error) {
            return Result.fail(`Error counting problems: ${error}`);
        }
    }
}
//# sourceMappingURL=SupabaseProblemRepository.js.map