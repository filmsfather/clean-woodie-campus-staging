import type { ICacheService } from '../../infrastructure/interfaces/ICacheService';
export declare class MockCacheService {
    private cache;
    get: import("vitest").Mock<[key: string], any>;
    set: import("vitest").Mock<[key: string, value: any, ttl?: number | undefined], boolean>;
    delete: import("vitest").Mock<[key: string], boolean>;
    del: import("vitest").Mock<[key: string], boolean>;
    delMany: import("vitest").Mock<any, any>;
    invalidatePattern: import("vitest").Mock<any, any>;
    expire: import("vitest").Mock<any, any>;
    ttl: import("vitest").Mock<any, any>;
    exists: import("vitest").Mock<any, any>;
    getStats: import("vitest").Mock<[], {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        hitRate: number;
    }>;
    resetStats: import("vitest").Mock<any, any>;
    disconnect: import("vitest").Mock<any, any>;
}
export declare const createMockCacheService: () => ICacheService;
export declare const createMockCacheServiceWithData: (data: Record<string, any>) => ICacheService;
//# sourceMappingURL=MockCacheService.d.ts.map