import { ICacheService } from '../../common/interfaces/ICacheService';
import { IProgressService, IProblemService } from '../../common/interfaces';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Result } from '@woodie/domain/common/Result';
/**
 * 캐시 워밍 설정
 */
export interface CacheWarmingConfig {
    enabled: boolean;
    scheduleHour: number;
    warmingStrategies: {
        popularProblems: boolean;
        topStreaks: boolean;
        systemStats: boolean;
        recentAggregates: boolean;
    };
}
/**
 * 캐시 워밍 결과
 */
export interface CacheWarmingResult {
    totalItemsWarmed: number;
    successfulWarms: number;
    failedWarms: number;
    executionTimeMs: number;
    details: Array<{
        category: string;
        items: number;
        success: boolean;
        error?: string;
    }>;
}
/**
 * 캐시 워밍 서비스
 * 시스템 성능 향상을 위해 자주 사용되는 데이터를 미리 캐시에 로드
 */
export declare class CacheWarmerService {
    private readonly cacheService;
    private readonly progressService;
    private readonly problemService;
    private readonly config;
    constructor(cacheService: ICacheService, progressService: IProgressService, problemService: IProblemService, config: CacheWarmingConfig);
    /**
     * 전체 캐시 워밍 실행
     */
    warmCache(): Promise<Result<CacheWarmingResult>>;
    /**
     * 인기 문제들 캐시 워밍
     */
    private warmPopularProblems;
    /**
     * 상위 스트릭들 캐시 워밍
     */
    private warmTopStreaks;
    /**
     * 시스템 통계 캐시 워밍
     */
    private warmSystemStats;
    /**
     * 최근 집계 데이터 캐시 워밍
     */
    private warmRecentAggregates;
    /**
     * 특정 학생의 캐시 프리로딩
     */
    warmStudentCache(studentId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 특정 교사의 캐시 프리로딩
     */
    warmTeacherCache(teacherId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 캐시 워밍 상태 조회
     */
    getCacheWarmingStatus(): Promise<Result<{
        lastWarmingTime?: Date;
        nextScheduledWarming?: Date;
        cacheHitRate: number;
        warmingConfig: CacheWarmingConfig;
    }>>;
    /**
     * 다음 워밍 시간 계산
     */
    private calculateNextWarmingTime;
    /**
     * 주 시작일(월요일) 계산
     */
    private getWeekStart;
}
//# sourceMappingURL=CacheWarmerService.d.ts.map