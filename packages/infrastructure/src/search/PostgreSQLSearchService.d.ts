import { SupabaseClient } from '@supabase/supabase-js';
import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ProblemSearchFilter, PaginationOptions, SortOptions, ProblemSearchResult } from '@woodie/domain/problems/repositories/IProblemRepository';
export interface SearchConfig {
    enableCaching?: boolean;
    cachePrefix?: string;
    defaultLanguage?: 'korean' | 'english' | 'simple';
    enableFuzzySearch?: boolean;
    maxSearchResults?: number;
}
export interface SearchAnalytics {
    totalQueries: number;
    cacheHitRate: number;
    averageQueryTime: number;
    popularQueries: Array<{
        query: string;
        count: number;
    }>;
    queryPerformanceStats: {
        fastest: number;
        slowest: number;
        median: number;
    };
    searchPatterns: {
        mostFrequentTerms: Array<{
            term: string;
            frequency: number;
        }>;
        searchTimeDistribution: Array<{
            timeRange: string;
            count: number;
        }>;
    };
}
export interface FullTextSearchResult {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    difficulty: number;
    type: string;
    rank: number;
    headline?: string;
}
export interface QueryPerformanceData {
    query: string;
    duration: number;
    timestamp: number;
    resultCount: number;
    wasFromCache: boolean;
}
export declare class PostgreSQLSearchService {
    private readonly supabase;
    private readonly cache?;
    private readonly logger;
    private readonly config;
    private readonly analytics;
    private readonly performanceData;
    private readonly searchTermFrequency;
    private queryCount;
    private cacheHits;
    private totalQueryTime;
    constructor(supabase: SupabaseClient, logger: ILogger, cache?: ICacheService, config?: SearchConfig);
    /**
     * 전문 검색 실행 (Full-Text Search)
     */
    executeFullTextSearch(query: string, filter: ProblemSearchFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<Result<ProblemSearchResult>>;
    /**
     * 유사 검색 (Similarity Search)
     */
    executeSimilaritySearch(referenceText: string, filter: ProblemSearchFilter, limit?: number): Promise<Result<Problem[]>>;
    /**
     * 검색 제안/자동완성
     */
    getSearchSuggestions(partialQuery: string, teacherId?: string, limit?: number): Promise<Result<string[]>>;
    /**
     * 검색 분석 정보 조회 - 상세 분석 로직 구현
     */
    getSearchAnalytics(): SearchAnalytics;
    /**
     * 검색 성능 상세 분석
     */
    getDetailedPerformanceAnalytics(): {
        recentQueries: QueryPerformanceData[];
        slowQueries: QueryPerformanceData[];
        cacheEffectiveness: {
            avgCacheHitTime: number;
            avgCacheMissTime: number;
            timeSaved: number;
            cacheHits: number;
            cacheMisses: number;
            cacheHitTime: number;
            cacheMissTime: number;
        };
        queryVolumeByHour: Record<string, number>;
        searchResultDistribution: {
            range: string;
            count: number;
        }[];
    };
    /**
     * 검색 트렌드 분석
     */
    getSearchTrends(timeRange?: 'hour' | 'day' | 'week'): {
        timeSlot: string;
        queryCount: number;
        averageDuration: number;
        uniqueQueries: number;
    }[];
    /**
     * 검색 인덱스 최적화
     */
    optimizeSearchIndex(): Promise<Result<void>>;
    /**
     * 분석 데이터 리셋
     */
    resetAnalytics(): void;
    private buildFullTextQuery;
    private applyFilters;
    private transformSearchResults;
    private transformToProblems;
    private mapSortField;
    private generateCacheKey;
    private hashString;
    private getCachedResult;
    private cacheResult;
    private updateAnalytics;
    private analyzeSearchTerms;
    private calculateTimeDistribution;
    private getQueryVolumeByHour;
    private getSearchResultDistribution;
    private getTimeSlot;
}
//# sourceMappingURL=PostgreSQLSearchService.d.ts.map