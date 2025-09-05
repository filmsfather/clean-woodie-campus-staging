import { IStudyStreakRepository } from '@woodie/domain/progress/repositories/IStudyStreakRepository';
import { IStatisticsRepository } from '@woodie/domain/progress/repositories/IStatisticsRepository';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { StudyStreak } from '@woodie/domain/progress/entities/StudyStreak';
import { Statistics } from '@woodie/domain/progress/entities/Statistics';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Result } from '@woodie/domain/common/Result';
/**
 * 진도 추적 서비스 인터페이스
 */
export interface IProgressService {
    getStudentStreak(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>>;
    getStudentStatistics(studentId: UniqueEntityID, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>>;
    getTopStreaks(limit?: number): Promise<Result<StudyStreak[]>>;
    getAtRiskStudents(): Promise<Result<StudyStreak[]>>;
    recordStudyActivity(studentId: UniqueEntityID, studyDate?: Date): Promise<Result<void>>;
    getClassProgress(classId: string): Promise<Result<any>>;
}
/**
 * 캐싱이 적용된 진도 추적 서비스
 * 학습 스트릭과 통계 정보에 대한 캐싱 전략을 구현
 */
export declare class CachedProgressService implements IProgressService {
    private readonly studyStreakRepository;
    private readonly statisticsRepository;
    private readonly cacheService;
    constructor(studyStreakRepository: IStudyStreakRepository, statisticsRepository: IStatisticsRepository, cacheService: ICacheService);
    /**
     * 학생의 학습 스트릭 조회 (캐싱 적용)
     */
    getStudentStreak(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>>;
    /**
     * 학생의 학습 통계 조회 (캐싱 적용)
     */
    getStudentStatistics(studentId: UniqueEntityID, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>>;
    /**
     * 상위 스트릭 순위 조회 (캐싱 적용)
     */
    getTopStreaks(limit?: number): Promise<Result<StudyStreak[]>>;
    /**
     * 스트릭이 위험한 학생들 조회 (캐싱 적용)
     */
    getAtRiskStudents(): Promise<Result<StudyStreak[]>>;
    /**
     * 학습 활동 기록 (캐시 무효화 적용)
     */
    recordStudyActivity(studentId: UniqueEntityID, studyDate?: Date): Promise<Result<void>>;
    /**
     * 클래스 진도 현황 조회 (캐싱 적용)
     */
    getClassProgress(classId: string): Promise<Result<any>>;
    /**
     * 학생의 진도 관련 캐시 무효화
     */
    private invalidateProgressCache;
    /**
     * 전체 진도 통계 조회 (집계 테이블 활용)
     */
    getSystemProgressStats(): Promise<Result<{
        totalActiveStudents: number;
        totalStreaks: number;
        avgStreakLength: number;
        studentsStudiedToday: number;
        studentsAtRisk: number;
    }>>;
}
//# sourceMappingURL=CachedProgressService.d.ts.map