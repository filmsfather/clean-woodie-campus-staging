import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { StudyStreak } from '@woodie/domain/progress';
/**
 * Supabase 기반 StudyStreak 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export class SupabaseStudyStreakRepository {
    tableName = 'study_streaks';
    schema = 'progress';
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * 학생 ID로 스트릭 조회
     */
    async findByStudentId(studentId) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .eq('student_id', studentId.toString())
                .single();
            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return Result.ok(null);
                }
                return Result.fail(`Failed to find study streak: ${error.message}`);
            }
            if (!data) {
                return Result.ok(null);
            }
            const domainResult = this.toDomain(data);
            if (domainResult.isFailure) {
                return Result.fail(domainResult.error);
            }
            return Result.ok(domainResult.value);
        }
        catch (err) {
            return Result.fail(`Unexpected error finding study streak: ${err}`);
        }
    }
    /**
     * 스트릭 저장 (생성 또는 업데이트)
     */
    async save(studyStreak) {
        try {
            const persistence = this.toPersistence(studyStreak);
            // upsert 사용 (student_id가 unique constraint이므로)
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .upsert(persistence, {
                onConflict: 'student_id'
            });
            if (error) {
                return Result.fail(`Failed to save study streak: ${error.message}`);
            }
            return Result.ok();
        }
        catch (err) {
            return Result.fail(`Unexpected error saving study streak: ${err}`);
        }
    }
    /**
     * 스트릭 삭제
     */
    async delete(studyStreakId) {
        try {
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .delete()
                .eq('id', studyStreakId.toString());
            if (error) {
                return Result.fail(`Failed to delete study streak: ${error.message}`);
            }
            return Result.ok();
        }
        catch (err) {
            return Result.fail(`Unexpected error deleting study streak: ${err}`);
        }
    }
    /**
     * 활성 스트릭을 가진 학생들 조회
     */
    async findActiveStreaks(daysThreshold = 2) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .gt('current_streak', 0)
                .gte('last_study_date', cutoffDate.toISOString().split('T')[0]) // Date only
                .order('current_streak', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find active streaks: ${error.message}`);
            }
            if (!data) {
                return Result.ok([]);
            }
            const domainResults = await Promise.all(data.map(row => this.toDomain(row)));
            const failures = domainResults.filter(result => result.isFailure);
            if (failures.length > 0) {
                return Result.fail(`Failed to convert some streaks: ${failures[0].error}`);
            }
            const streaks = domainResults.map(result => result.value);
            return Result.ok(streaks);
        }
        catch (err) {
            return Result.fail(`Unexpected error finding active streaks: ${err}`);
        }
    }
    /**
     * 위험 상태의 스트릭들 조회 (끊어질 위험이 있는)
     */
    async findAtRiskStreaks() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .gt('current_streak', 0)
                .eq('last_study_date', yesterdayStr)
                .order('current_streak', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find at-risk streaks: ${error.message}`);
            }
            if (!data) {
                return Result.ok([]);
            }
            const domainResults = await Promise.all(data.map(row => this.toDomain(row)));
            const failures = domainResults.filter(result => result.isFailure);
            if (failures.length > 0) {
                return Result.fail(`Failed to convert some streaks: ${failures[0].error}`);
            }
            const streaks = domainResults.map(result => result.value);
            return Result.ok(streaks);
        }
        catch (err) {
            return Result.fail(`Unexpected error finding at-risk streaks: ${err}`);
        }
    }
    /**
     * 최장 스트릭 순위 조회
     */
    async findTopStreaks(limit = 10) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .order('longest_streak', { ascending: false })
                .limit(limit);
            if (error) {
                return Result.fail(`Failed to find top streaks: ${error.message}`);
            }
            if (!data) {
                return Result.ok([]);
            }
            const domainResults = await Promise.all(data.map(row => this.toDomain(row)));
            const failures = domainResults.filter(result => result.isFailure);
            if (failures.length > 0) {
                return Result.fail(`Failed to convert some streaks: ${failures[0].error}`);
            }
            const streaks = domainResults.map(result => result.value);
            return Result.ok(streaks);
        }
        catch (err) {
            return Result.fail(`Unexpected error finding top streaks: ${err}`);
        }
    }
    /**
     * 클래스별 스트릭 통계 조회
     */
    async findByClassId(classId) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select(`
          *,
          profiles!inner (
            id,
            class_enrollments!inner (
              class_id
            )
          )
        `)
                .eq('profiles.class_enrollments.class_id', classId)
                .order('current_streak', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find streaks by class: ${error.message}`);
            }
            if (!data) {
                return Result.ok([]);
            }
            const domainResults = await Promise.all(data.map(row => this.toDomain(row)));
            const failures = domainResults.filter(result => result.isFailure);
            if (failures.length > 0) {
                return Result.fail(`Failed to convert some streaks: ${failures[0].error}`);
            }
            const streaks = domainResults.map(result => result.value);
            return Result.ok(streaks);
        }
        catch (err) {
            return Result.fail(`Unexpected error finding streaks by class: ${err}`);
        }
    }
    /**
     * 데이터베이스 행을 도메인 엔티티로 변환
     */
    toDomain(row) {
        try {
            const studyStreak = StudyStreak.reconstitute({
                studentId: new UniqueEntityID(row.student_id),
                currentStreak: row.current_streak,
                longestStreak: row.longest_streak,
                lastStudyDate: new Date(row.last_study_date + 'T00:00:00.000Z'), // Date only
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at)
            }, new UniqueEntityID(row.id));
            return Result.ok(studyStreak);
        }
        catch (err) {
            return Result.fail(`Failed to convert row to domain: ${err}`);
        }
    }
    /**
     * 도메인 엔티티를 데이터베이스 행으로 변환
     */
    toPersistence(studyStreak) {
        return {
            id: studyStreak.id.toString(),
            student_id: studyStreak.studentId.toString(),
            current_streak: studyStreak.currentStreak,
            longest_streak: studyStreak.longestStreak,
            last_study_date: studyStreak.lastStudyDate.toISOString().split('T')[0], // Date only
            created_at: studyStreak.createdAt.toISOString(),
            updated_at: studyStreak.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=SupabaseStudyStreakRepository.js.map