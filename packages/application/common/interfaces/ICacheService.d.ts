export interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    serialize?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    hitRate: number;
}
export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
    mget<T>(keys: string[]): Promise<Array<T | null>>;
    mset<T>(entries: Array<{
        key: string;
        value: T;
        options?: CacheOptions;
    }>): Promise<void>;
    mdelete(keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    deleteByPattern(pattern: string): Promise<number>;
    invalidateByTags(tags: string[]): Promise<number>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    stats(): Promise<CacheStats>;
    increment(key: string, delta?: number): Promise<number>;
    decrement(key: string, delta?: number): Promise<number>;
    lock?(key: string, ttl: number): Promise<boolean>;
    unlock?(key: string): Promise<boolean>;
}
export declare class CacheKeyBuilder {
    private static readonly SEPARATOR;
    static forProblem(problemId: string): string;
    static forTeacherProblems(teacherId: string): string;
    static forTeacherStatistics(teacherId: string): string;
    static forTagAnalytics(teacherId: string): string;
    static forDifficultyAnalysis(teacherId: string): string;
    static forSearchResult(hash: string): string;
    static forTagRecommendation(contentHash: string): string;
    static forBulkPermission(teacherId: string, problemIdsHash: string): string;
    static teacherPattern(teacherId: string): string;
    static problemPattern(problemId: string): string;
}
export declare class CacheTags {
    static readonly TEACHER_DATA = "teacher_data";
    static readonly PROBLEM_DATA = "problem_data";
    static readonly STATISTICS = "statistics";
    static readonly ANALYTICS = "analytics";
    static readonly SEARCH_RESULTS = "search_results";
    static readonly RECOMMENDATIONS = "recommendations";
    static forTeacher(teacherId: string): string;
    static forProblem(problemId: string): string;
}
export declare class CacheStrategies {
    static readonly SHORT_TTL = 300;
    static readonly MEDIUM_TTL = 1800;
    static readonly LONG_TTL = 3600;
    static readonly VERY_LONG_TTL = 86400;
    static getStatisticsOptions(): CacheOptions;
    static getSearchOptions(): CacheOptions;
    static getProblemOptions(): CacheOptions;
    static getRecommendationOptions(): CacheOptions;
}
//# sourceMappingURL=ICacheService.d.ts.map