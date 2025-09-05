export interface ICacheService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    deleteByPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    setIfNotExists(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    clear(): Promise<void>;
}
//# sourceMappingURL=ICacheService.d.ts.map