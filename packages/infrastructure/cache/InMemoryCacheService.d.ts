import { ICacheService, CacheOptions, CacheStats } from '@woodie/application/common/interfaces/ICacheService';
export declare class InMemoryCacheService implements ICacheService {
    private readonly store;
    private readonly tagMap;
    private readonly _stats;
    private readonly keyPrefix;
    private cleanupInterval?;
    constructor(keyPrefix?: string, cleanupIntervalMs?: number);
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
    destroy(): void;
    private buildKey;
    private updateHitRate;
    private removeFromTagMap;
    private cleanup;
}
//# sourceMappingURL=InMemoryCacheService.d.ts.map