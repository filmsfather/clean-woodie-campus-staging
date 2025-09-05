import { ICacheService, CacheOptions, CacheStats } from '@woodie/application/common/interfaces/ICacheService';
export interface RedisCacheConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    maxRetriesPerRequest?: number;
    commandTimeout?: number;
}
export declare class RedisCacheService implements ICacheService {
    private logger?;
    private readonly redis;
    private readonly _stats;
    private readonly keyPrefix;
    private readonly tagMap;
    constructor(config?: RedisCacheConfig, logger?: {
        info: (msg: string, meta?: any) => void;
        error: (msg: string, meta?: any) => void;
        warn: (msg: string, meta?: any) => void;
    } | undefined);
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
    disconnect(): Promise<void>;
    private buildKey;
    private updateHitRate;
    private removeFromTagMap;
    private setupEventListeners;
}
//# sourceMappingURL=RedisCacheService.d.ts.map